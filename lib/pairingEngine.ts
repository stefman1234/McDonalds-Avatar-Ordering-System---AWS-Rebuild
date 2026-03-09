import type { CartItem, MenuItemDTO } from "@/lib/types";

// Category pairing rules: if user ordered from key, suggest from values
const PAIRINGS: Record<string, string[]> = {
  "Burgers": ["Fries", "Drinks", "Desserts"],
  "Chicken": ["Fries", "Drinks", "Sauces"],
  "Breakfast": ["Coffee", "Beverages", "Sides"],
  "Fries": ["Drinks", "Sauces"],
  "Drinks": ["Desserts", "Fries"],
  "Desserts": ["Drinks"],
};

// Popular items to suggest first (by name substring)
const POPULAR_ITEMS = [
  "Medium Fries",
  "Large Fries",
  "Medium Coke",
  "Large Coke",
  "McFlurry",
  "Apple Pie",
  "Hash Browns",
  "Coffee",
];

// Time-of-day boosted categories: hour range -> boosted categories
const TIME_OF_DAY_BOOSTS: Array<{ from: number; to: number; categories: string[] }> = [
  { from: 5,  to: 11, categories: ["Coffee", "Beverages", "Breakfast"] },  // Breakfast
  { from: 11, to: 14, categories: ["Burgers", "Fries", "Drinks"] },         // Lunch rush
  { from: 14, to: 17, categories: ["Desserts", "McFlurry", "Drinks"] },     // Afternoon sweet
  { from: 17, to: 21, categories: ["Burgers", "Chicken", "Fries"] },        // Dinner
  { from: 21, to: 24, categories: ["Desserts", "Chicken"] },                // Late night
];

/** Returns a 0–1 boost multiplier for an item based on current time of day. */
function getTimeBoost(item: MenuItemDTO, hourOfDay: number): number {
  for (const band of TIME_OF_DAY_BOOSTS) {
    if (hourOfDay >= band.from && hourOfDay < band.to) {
      if (
        band.categories.some(
          (c) => item.categoryName.includes(c) || item.name.includes(c)
        )
      ) {
        return 1;
      }
    }
  }
  return 0;
}

/**
 * Get upsell suggestions based on what's in the cart.
 * Returns items from paired categories, prioritizing popular items and time-of-day relevance.
 */
export function getSuggestions(
  cartItems: CartItem[],
  allMenuItems: MenuItemDTO[],
  maxSuggestions: number = 3
): MenuItemDTO[] {
  if (cartItems.length === 0) return [];

  const hourOfDay = new Date().getHours();

  // Determine which categories the user has ordered from
  const orderedItemIds = new Set(cartItems.map((ci) => ci.menuItemId));
  const orderedCategories = new Set<string>();

  for (const menuItem of allMenuItems) {
    if (orderedItemIds.has(menuItem.id)) {
      orderedCategories.add(menuItem.categoryName);
    }
  }

  // Collect suggested category names
  const suggestedCategories = new Set<string>();
  for (const ordered of orderedCategories) {
    const pairs = PAIRINGS[ordered];
    if (pairs) {
      for (const cat of pairs) suggestedCategories.add(cat);
    }
  }

  // Remove categories user already ordered from
  for (const cat of orderedCategories) {
    suggestedCategories.delete(cat);
  }

  // Get candidate items from suggested categories
  const candidates = allMenuItems.filter(
    (item) =>
      suggestedCategories.has(item.categoryName) &&
      !orderedItemIds.has(item.id) &&
      item.available
  );

  // Sort: time-boosted first, then popular, then price ascending
  candidates.sort((a, b) => {
    const aBoost = getTimeBoost(a, hourOfDay);
    const bBoost = getTimeBoost(b, hourOfDay);
    if (aBoost !== bBoost) return bBoost - aBoost;
    const aPopular = POPULAR_ITEMS.some((p) => a.name.includes(p)) ? 0 : 1;
    const bPopular = POPULAR_ITEMS.some((p) => b.name.includes(p)) ? 0 : 1;
    if (aPopular !== bPopular) return aPopular - bPopular;
    return a.price - b.price;
  });

  return candidates.slice(0, maxSuggestions);
}

/**
 * Build a natural language suggestion for the avatar to speak.
 */
export function buildSuggestionPrompt(
  suggestions: MenuItemDTO[],
  cartCategories: string[]
): string | null {
  if (suggestions.length === 0) return null;

  // Simple suggestion based on what's missing
  const hasFries = cartCategories.includes("Fries");
  const hasDrink = cartCategories.includes("Drinks");

  if (!hasFries && suggestions.some((s) => s.categoryName === "Fries")) {
    return "Would you like fries with that?";
  }

  if (!hasDrink && suggestions.some((s) => s.categoryName === "Drinks")) {
    return "Can I get you a drink to go with your meal?";
  }

  if (suggestions.length > 0) {
    return `How about adding a ${suggestions[0].name}?`;
  }

  return null;
}
