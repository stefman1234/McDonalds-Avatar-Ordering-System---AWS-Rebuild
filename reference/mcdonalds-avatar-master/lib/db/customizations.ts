import prisma from '@/lib/prisma';

/**
 * Get all customization options
 */
export async function getAllCustomizationOptions() {
  return prisma.customization_options.findMany({
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  });
}

/**
 * Get customization options by category (add, remove, modify, substitute)
 */
export async function getCustomizationsByCategory(category: string) {
  return prisma.customization_options.findMany({
    where: {
      category,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

/**
 * Get customizations applicable to a specific menu category
 */
export async function getCustomizationsForMenuCategory(menuCategory: string) {
  return prisma.customization_options.findMany({
    where: {
      applicable_to: {
        contains: menuCategory,
      },
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  });
}

/**
 * Get customization option by ID
 */
export async function getCustomizationById(id: string) {
  return prisma.customization_options.findUnique({
    where: { id },
  });
}

/**
 * Get free customization options (no extra charge)
 */
export async function getFreeCustomizations() {
  return prisma.customization_options.findMany({
    where: {
      price_modifier: 0,
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  });
}

/**
 * Get paid customization options (extra charge)
 */
export async function getPaidCustomizations() {
  return prisma.customization_options.findMany({
    where: {
      price_modifier: {
        gt: 0,
      },
    },
    orderBy: [
      { price_modifier: 'asc' },
      { name: 'asc' },
    ],
  });
}
