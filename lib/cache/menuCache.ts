import { prisma } from "@/lib/db";
import { putItem, getItem, getTableName } from "@/lib/dynamodb";
import type { MenuItemDTO, CategoryDTO } from "@/lib/types";

// L1: In-memory cache (5-minute TTL)
const L1_TTL = 5 * 60 * 1000;
let menuItemsCache: MenuItemDTO[] | null = null;
let categoriesCache: CategoryDTO[] | null = null;
let cacheExpiry = 0;

// L2: DynamoDB cache (60-minute TTL)
const L2_TTL = 60 * 60 * 1000;
const DYNAMO_CACHE_KEY = "full-menu";

function dynamoTable(): string {
  return getTableName("cache");
}

async function fetchFromDB() {
  const [categories, popularCombos] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          where: { available: true },
          include: { aliases: true, customizations: true },
        },
      },
    }),
    prisma.comboMeal.findMany({
      where: { popular: true, available: true },
      select: { mainItemId: true },
    }),
  ]);

  const popularMainItemIds = new Set(popularCombos.map((c) => c.mainItemId));

  const catDTOs: CategoryDTO[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    sortOrder: cat.sortOrder,
    items: cat.items.map(
      (item): MenuItemDTO => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        imageUrl: item.imageUrl,
        available: item.available,
        categoryId: item.categoryId,
        categoryName: cat.name,
        aliases: item.aliases.map((a) => a.alias),
        customizations: item.customizations.map((c) => ({
          id: c.id,
          name: c.name,
          priceExtra: Number(c.priceExtra),
        })),
        popular: popularMainItemIds.has(item.id),
      })
    ),
  }));

  const allItems = catDTOs.flatMap((c) => c.items);
  return { categories: catDTOs, items: allItems };
}

async function readL2(): Promise<{ categories: CategoryDTO[]; items: MenuItemDTO[] } | null> {
  const record = await getItem(dynamoTable(), { cacheKey: DYNAMO_CACHE_KEY });
  if (!record || !record.data) return null;
  try {
    return JSON.parse(record.data as string);
  } catch {
    return null;
  }
}

async function writeL2(categories: CategoryDTO[], items: MenuItemDTO[]): Promise<void> {
  const expiresAt = Math.floor((Date.now() + L2_TTL) / 1000);
  await putItem(dynamoTable(), {
    cacheKey: DYNAMO_CACHE_KEY,
    data: JSON.stringify({ categories, items }),
    expiresAt,
  });
}

function setL1(categories: CategoryDTO[], items: MenuItemDTO[]) {
  categoriesCache = categories;
  menuItemsCache = items;
  cacheExpiry = Date.now() + L1_TTL;
}

async function loadMenu(): Promise<{ categories: CategoryDTO[]; items: MenuItemDTO[] }> {
  // L2: Try DynamoDB
  const l2 = await readL2();
  if (l2) {
    setL1(l2.categories, l2.items);
    return l2;
  }

  // L3: Database
  const db = await fetchFromDB();
  setL1(db.categories, db.items);
  // Write to L2 (fire-and-forget)
  writeL2(db.categories, db.items).catch(() => {});
  return db;
}

export async function getCachedMenu(): Promise<MenuItemDTO[]> {
  // L1 hit
  if (menuItemsCache && Date.now() < cacheExpiry) {
    return menuItemsCache;
  }
  const { items } = await loadMenu();
  return items;
}

export async function getCachedCategories(): Promise<CategoryDTO[]> {
  // L1 hit
  if (categoriesCache && Date.now() < cacheExpiry) {
    return categoriesCache;
  }
  const { categories } = await loadMenu();
  return categories;
}
