import { prisma } from "@/lib/db";
import type { ComboMealDTO } from "@/lib/types";

/**
 * Check if a menu item has an associated combo meal.
 * Returns the combo if available, null otherwise.
 */
export async function checkMealConversion(menuItemId: number): Promise<ComboMealDTO | null> {
  const combo = await prisma.comboMeal.findFirst({
    where: {
      mainItemId: menuItemId,
      available: true,
    },
    include: { aliases: true },
  });

  if (!combo) return null;

  return {
    id: combo.id,
    name: combo.name,
    description: combo.description,
    basePrice: Number(combo.basePrice),
    discount: Number(combo.discount),
    mainItemId: combo.mainItemId,
    defaultSideId: combo.defaultSideId,
    defaultDrinkId: combo.defaultDrinkId,
    available: combo.available,
    popular: combo.popular,
    aliases: combo.aliases.map((a) => a.alias),
  };
}

/**
 * Get menu item details for combo defaults (side + drink).
 */
export async function getComboDefaults(combo: ComboMealDTO) {
  const [side, drink] = await Promise.all([
    combo.defaultSideId
      ? prisma.menuItem.findUnique({ where: { id: combo.defaultSideId } })
      : null,
    combo.defaultDrinkId
      ? prisma.menuItem.findUnique({ where: { id: combo.defaultDrinkId } })
      : null,
  ]);

  return {
    side: side ? { id: side.id, name: side.name, price: Number(side.price) } : null,
    drink: drink ? { id: drink.id, name: drink.name, price: Number(drink.price) } : null,
  };
}
