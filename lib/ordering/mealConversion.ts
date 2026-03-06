const MEAL_ELIGIBLE_CATEGORIES = ["burgers", "chicken", "fish", "breakfast"];

const MEAL_ELIGIBLE_KEYWORDS = [
  "big mac",
  "quarter pounder",
  "mcchicken",
  "filet-o-fish",
  "filet o fish",
  "cheeseburger",
  "hamburger",
  "chicken",
  "nuggets",
  "spicy",
  "double",
];

export function isMealEligible(item: {
  name: string;
  categoryName?: string;
}): boolean {
  const name = item.name.toLowerCase();
  const cat = (item.categoryName ?? "").toLowerCase();

  if (MEAL_ELIGIBLE_CATEGORIES.some((c) => cat.includes(c))) return true;
  if (MEAL_ELIGIBLE_KEYWORDS.some((k) => name.includes(k))) return true;
  return false;
}

export function hasMealEligibleItems(
  items: { name: string; categoryName?: string }[]
): boolean {
  return items.some(isMealEligible);
}

export function generateMealConversionOffer(
  items: { name: string }[]
): string {
  if (items.length === 1) {
    return `Would you like to make your ${items[0].name} a meal? It comes with a side and a drink for just $2.50 more.`;
  }
  const names = items.map((i) => i.name).join(" and ");
  return `Would you like to make any of those a meal? Your ${names} can come with a side and a drink.`;
}

const REJECTION_PATTERN =
  /\b(solo|no\b|nope|nah|no thanks|skip|not now|just the|just that|no meal|single|alone)\b/i;
const ACCEPTANCE_PATTERN =
  /\b(yes|yeah|yep|sure|ok|okay|make it a meal|all of them|everything|meal please)\b/i;

export function parseMealConversionResponse(
  text: string,
  eligibleItems?: { name: string }[]
): {
  accepted: boolean;
  itemIndex?: number;
  size?: "medium" | "large";
} {
  const t = text.toLowerCase();

  // Check for rejection first
  if (REJECTION_PATTERN.test(t)) {
    return { accepted: false };
  }

  // Check for size in acceptance
  let size: "medium" | "large" | undefined;
  if (/\b(large|big|upsize)\b/.test(t)) size = "large";
  else if (/\b(medium|regular)\b/.test(t)) size = "medium";

  // Check for specific item reference
  if (eligibleItems && eligibleItems.length > 1) {
    for (let i = 0; i < eligibleItems.length; i++) {
      if (t.includes(eligibleItems[i].name.toLowerCase())) {
        return { accepted: true, itemIndex: i, size };
      }
    }
  }

  // Generic acceptance
  if (ACCEPTANCE_PATTERN.test(t) || size) {
    return { accepted: true, itemIndex: 0, size };
  }

  // Default to rejection
  return { accepted: false };
}
