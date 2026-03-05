import prisma from '@/lib/prisma';
import type { Prisma } from '@/lib/generated/prisma';

/**
 * Get all menu items with optional filtering
 */
export async function getMenuItems(options?: {
  category?: string;
  available?: boolean;
  popular?: boolean;
  timeRestriction?: string;
}) {
  const where: Prisma.menu_itemsWhereInput = {};

  if (options?.category) where.category = options.category;
  if (options?.available !== undefined) where.available = options.available;
  if (options?.popular !== undefined) where.popular = options.popular;
  if (options?.timeRestriction) where.time_restriction = options.timeRestriction;

  return prisma.menu_items.findMany({
    where,
    include: {
      menu_item_sizes: true,
    },
    orderBy: [
      { popular: 'desc' },
      { name: 'asc' },
    ],
  });
}

/**
 * Get a single menu item by ID
 */
export async function getMenuItemById(id: string) {
  return prisma.menu_items.findUnique({
    where: { id },
    include: {
      menu_item_sizes: true,
    },
  });
}

/**
 * Get menu items by category
 */
export async function getMenuItemsByCategory(category: string) {
  return prisma.menu_items.findMany({
    where: {
      category,
      available: true,
    },
    include: {
      menu_item_sizes: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

/**
 * Get popular menu items
 */
export async function getPopularMenuItems() {
  return prisma.menu_items.findMany({
    where: {
      popular: true,
      available: true,
    },
    include: {
      menu_item_sizes: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

/**
 * Search menu items by name
 */
export async function searchMenuItems(query: string) {
  return prisma.menu_items.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive',
      },
      available: true,
    },
    include: {
      menu_item_sizes: true,
    },
    orderBy: {
      popular: 'desc',
    },
  });
}

/**
 * Get all available categories
 */
export async function getMenuCategories() {
  const items = await prisma.menu_items.findMany({
    where: {
      available: true,
    },
    select: {
      category: true,
    },
    distinct: ['category'],
  });

  return items.map((item) => item.category);
}
