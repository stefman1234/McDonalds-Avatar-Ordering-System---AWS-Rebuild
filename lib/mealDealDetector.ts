import type { CartItem, ComboMealDTO, MealDealSuggestion } from "@/lib/types";

/**
 * Detect if items in the cart could be cheaper as a combo meal.
 * Compares current cart item prices against available combo prices.
 */
export function detectMealDeals(
  cartItems: CartItem[],
  combos: ComboMealDTO[]
): MealDealSuggestion[] {
  const suggestions: MealDealSuggestion[] = [];

  for (const combo of combos) {
    if (!combo.available) continue;

    // Find the main item in cart
    const mainItem = cartItems.find((ci) => ci.menuItemId === combo.mainItemId);
    if (!mainItem) continue;

    // Calculate what user is currently paying for these items
    const matchedItemIds = [mainItem.id];
    let currentTotal = mainItem.unitPrice * mainItem.quantity;

    // Check for side
    if (combo.defaultSideId) {
      const sideItem = cartItems.find(
        (ci) => ci.menuItemId === combo.defaultSideId && !matchedItemIds.includes(ci.id)
      );
      if (sideItem) {
        matchedItemIds.push(sideItem.id);
        currentTotal += sideItem.unitPrice * sideItem.quantity;
      }
    }

    // Check for drink
    if (combo.defaultDrinkId) {
      const drinkItem = cartItems.find(
        (ci) => ci.menuItemId === combo.defaultDrinkId && !matchedItemIds.includes(ci.id)
      );
      if (drinkItem) {
        matchedItemIds.push(drinkItem.id);
        currentTotal += drinkItem.unitPrice * drinkItem.quantity;
      }
    }

    // Only suggest if we matched at least 2 items and there are actual savings
    const comboPrice = combo.basePrice - combo.discount;
    const savings = currentTotal - comboPrice;

    if (matchedItemIds.length >= 2 && savings > 0.5) {
      suggestions.push({
        combo,
        currentTotal,
        comboPrice,
        savings,
        matchedItemIds,
      });
    }
  }

  // Sort by highest savings first
  return suggestions.sort((a, b) => b.savings - a.savings);
}
