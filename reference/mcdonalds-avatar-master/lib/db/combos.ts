import prisma from '@/lib/prisma';

/**
 * Get all combo meals
 */
export async function getAllComboMeals() {
  return prisma.combo_meals.findMany({
    where: {
      available: true,
    },
    orderBy: [
      { popular: 'desc' },
      { name: 'asc' },
    ],
  });
}

/**
 * Get popular combo meals
 */
export async function getPopularComboMeals() {
  return prisma.combo_meals.findMany({
    where: {
      popular: true,
      available: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

/**
 * Get combo meal by ID
 */
export async function getComboMealById(id: string) {
  return prisma.combo_meals.findUnique({
    where: { id },
  });
}

/**
 * Search combo meals by name
 */
export async function searchComboMeals(query: string) {
  return prisma.combo_meals.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive',
      },
      available: true,
    },
    orderBy: {
      popular: 'desc',
    },
  });
}
