import type { MealSideOption, MealDrinkOption } from "@/lib/types";

export const MEAL_SIDES: MealSideOption[] = [
  { id: "fries", name: "Fries", priceModifier: 0 },
  { id: "corn", name: "Corn Cup", priceModifier: 0 },
  { id: "salad", name: "Garden Salad", priceModifier: 0.5 },
];

export const MEAL_DRINKS: MealDrinkOption[] = [
  { id: "coke", name: "Coke", priceModifier: 0 },
  { id: "sprite", name: "Sprite", priceModifier: 0 },
  { id: "fanta", name: "Fanta", priceModifier: 0 },
  { id: "milo", name: "Milo", priceModifier: 0 },
  { id: "orange-juice", name: "Orange Juice", priceModifier: 0.5 },
  { id: "water", name: "Water", priceModifier: 0 },
];

export interface PendingMealDetails {
  size?: "medium" | "large";
  side?: MealSideOption;
  drink?: MealDrinkOption;
  iceLevel?: "none" | "less" | "full";
}

export function parseMealSize(text: string): "medium" | "large" | null {
  const t = text.toLowerCase();
  if (/\b(large|upsize|go large|size up|supersize)\b/.test(t)) return "large";
  if (/\b(medium|regular|normal)\b/.test(t)) return "medium";
  return null;
}

export function parseIceLevel(text: string): "none" | "less" | "full" | null {
  const t = text.toLowerCase();
  if (/\b(no ice|without ice|none)\b/.test(t)) return "none";
  if (/\b(less ice|little ice|light ice)\b/.test(t)) return "less";
  if (/\b(regular ice|normal ice|full ice|ice)\b/.test(t)) return "full";
  return null;
}

export function findSideByName(text: string): MealSideOption | null {
  const t = text.toLowerCase();
  for (const side of MEAL_SIDES) {
    if (t.includes(side.name.toLowerCase()) || t.includes(side.id)) return side;
  }
  // Fuzzy: "fries" matches "Fries", "corn" matches "Corn Cup"
  if (/\bfri(es|y)\b/.test(t)) return MEAL_SIDES[0];
  if (/\bcorn\b/.test(t)) return MEAL_SIDES[1];
  if (/\bsalad\b/.test(t)) return MEAL_SIDES[2];
  return null;
}

export function findDrinkByName(text: string): MealDrinkOption | null {
  const t = text.toLowerCase();
  for (const drink of MEAL_DRINKS) {
    if (t.includes(drink.name.toLowerCase()) || t.includes(drink.id)) return drink;
  }
  // Fuzzy matches
  if (/\bcoke|coca.?cola|cola\b/.test(t)) return MEAL_DRINKS[0];
  if (/\bsprite\b/.test(t)) return MEAL_DRINKS[1];
  if (/\bfanta|orange soda\b/.test(t)) return MEAL_DRINKS[2];
  if (/\bmilo\b/.test(t)) return MEAL_DRINKS[3];
  if (/\bjuice|oj\b/.test(t)) return MEAL_DRINKS[4];
  if (/\bwater\b/.test(t)) return MEAL_DRINKS[5];
  return null;
}

export function isMealComplete(details: PendingMealDetails): boolean {
  return !!(details.size && details.side && details.drink && details.iceLevel);
}

export function getMissingMealComponents(details: PendingMealDetails): string[] {
  const missing: string[] = [];
  if (!details.size) missing.push("meal_size");
  if (!details.side) missing.push("meal_side");
  if (!details.drink) missing.push("meal_drink");
  if (!details.iceLevel) missing.push("ice_level");
  return missing;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class MealQuestionGenerator {
  static generateMealSizeQuestion(itemName: string): string {
    return randomFrom([
      `Would you like your ${itemName} meal in medium or large?`,
      `What size meal would you like? Medium or large?`,
      `Should I make that a medium or large ${itemName} meal?`,
    ]);
  }

  static generateSideQuestion(): string {
    return randomFrom([
      "What side would you like? We have fries, corn cup, or garden salad.",
      "And for your side? Fries, corn cup, or garden salad?",
      "Pick a side: fries, corn cup, or garden salad.",
    ]);
  }

  static generateDrinkQuestion(): string {
    return randomFrom([
      "What would you like to drink? We have Coke, Sprite, Fanta, Milo, orange juice, or water.",
      "And for your drink?",
      "What drink would you like with that?",
    ]);
  }

  static generateIceLevelQuestion(drinkName: string): string {
    return randomFrom([
      `How much ice in your ${drinkName}? Regular, less, or no ice?`,
      `Would you like regular ice, less ice, or no ice in your ${drinkName}?`,
    ]);
  }

  static generateMealCompleteMessage(itemName: string): string {
    return randomFrom([
      `Your ${itemName} meal is all set!`,
      `Got it, your ${itemName} meal is ready to go!`,
      `Perfect, I've got your ${itemName} meal configured.`,
    ]);
  }

  static generateQuestionForStep(
    step: string,
    itemName: string,
    drinkName?: string
  ): string {
    switch (step) {
      case "meal_size":
        return this.generateMealSizeQuestion(itemName);
      case "meal_side":
        return this.generateSideQuestion();
      case "meal_drink":
        return this.generateDrinkQuestion();
      case "ice_level":
        return this.generateIceLevelQuestion(drinkName ?? "drink");
      case "complete":
        return this.generateMealCompleteMessage(itemName);
      default:
        return "";
    }
  }
}
