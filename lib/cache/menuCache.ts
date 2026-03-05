import { prisma } from "@/lib/db";
import type { MenuItemDTO, CategoryDTO } from "@/lib/types";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let menuItemsCache: MenuItemDTO[] | null = null;
let categoriesCache: CategoryDTO[] | null = null;
let cacheExpiry = 0;

async function fetchFromDB() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { available: true },
        include: { aliases: true, customizations: true },
      },
    },
  });

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
      })
    ),
  }));

  const allItems = catDTOs.flatMap((c) => c.items);
  return { categories: catDTOs, items: allItems };
}

export async function getCachedMenu(): Promise<MenuItemDTO[]> {
  if (menuItemsCache && Date.now() < cacheExpiry) {
    return menuItemsCache;
  }
  const { categories, items } = await fetchFromDB();
  categoriesCache = categories;
  menuItemsCache = items;
  cacheExpiry = Date.now() + CACHE_TTL;
  return items;
}

export async function getCachedCategories(): Promise<CategoryDTO[]> {
  if (categoriesCache && Date.now() < cacheExpiry) {
    return categoriesCache;
  }
  const { categories, items } = await fetchFromDB();
  categoriesCache = categories;
  menuItemsCache = items;
  cacheExpiry = Date.now() + CACHE_TTL;
  return categories;
}
