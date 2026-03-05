/**
 * Meal Customization Flow
 * Generates questions and manages meal customization conversation
 */

import type { MealCustomizationStep, PendingOrderItem } from '@/lib/state/pendingOrderManager';

/**
 * Question templates for meal customization
 */
export class MealQuestionGenerator {
  /**
   * Generate question for meal size
   */
  static generateMealSizeQuestion(itemName: string): string {
    const templates = [
      `Great choice! Would you like your ${itemName} meal medium or large?`,
      `Perfect! What size meal would you prefer - medium or large?`,
      `For your ${itemName} meal, would you like it medium or large?`,
    ];
    return this.selectRandom(templates);
  }

  /**
   * Generate question for side selection
   */
  static generateSideQuestion(): string {
    const templates = [
      "What side would you like with that? We have fries, corn cup, or garden salad.",
      "Which side would you prefer - fries, corn cup, or garden salad?",
      "Great! Fries, corn cup, or garden salad for your side?",
    ];
    return this.selectRandom(templates);
  }

  /**
   * Generate question for drink selection
   */
  static generateDrinkQuestion(): string {
    const templates = [
      "And what drink would you like? We have Coke, Sprite, Fanta, Milo, and more.",
      "What drink can I get you? We have Coke, Sprite, Fanta, Milo, orange juice, and more.",
      "Perfect! What drink would you like? Coke, Sprite, Fanta, or Milo?",
    ];
    return this.selectRandom(templates);
  }

  /**
   * Generate question for ice level
   */
  static generateIceLevelQuestion(drinkName: string): string {
    const templates = [
      `Would you like ice with your ${drinkName}? Full ice, less ice, or no ice?`,
      `How much ice would you like in your ${drinkName} - full, less, or none?`,
      `Ice level for your ${drinkName}? Full ice, less ice, or no ice?`,
    ];
    return this.selectRandom(templates);
  }

  /**
   * Generate meal completion confirmation
   */
  static generateMealCompleteMessage(item: PendingOrderItem): string {
    const size = item.mealDetails?.size || 'medium';
    const side = item.mealDetails?.side?.name || 'fries';
    const drink = item.mealDetails?.drink?.name || 'Coke';
    const ice = item.mealDetails?.iceLevel || 'full';

    const iceText = ice === 'none' ? 'no ice' : ice === 'less' ? 'less ice' : 'full ice';

    const templates = [
      `Awesome! I've added a ${size} ${item.name} meal with ${side} and ${drink} (${iceText}). Anything else?`,
      `Perfect! Your ${size} ${item.name} meal with ${side} and ${drink} (${iceText}) is ready. What else can I get you?`,
      `Great! ${size.charAt(0).toUpperCase() + size.slice(1)} ${item.name} meal with ${side} and ${drink} (${iceText}) added to your order. Anything else?`,
    ];
    return this.selectRandom(templates);
  }

  /**
   * Select random template
   */
  private static selectRandom(templates: string[]): string {
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate question based on current step
   */
  static generateQuestionForStep(step: MealCustomizationStep, item: PendingOrderItem): string {
    switch (step) {
      case 'meal_size':
        return this.generateMealSizeQuestion(item.name);
      case 'meal_side':
        return this.generateSideQuestion();
      case 'meal_drink':
        return this.generateDrinkQuestion();
      case 'ice_level':
        const drinkName = item.mealDetails?.drink?.name || 'drink';
        return this.generateIceLevelQuestion(drinkName);
      case 'complete':
        return this.generateMealCompleteMessage(item);
      default:
        return "What else can I get you?";
    }
  }
}

/**
 * Check if meal is complete
 */
export function isMealComplete(item: PendingOrderItem): boolean {
  if (!item.isMeal) return false;

  const details = item.mealDetails;
  return !!(
    details?.size &&
    details?.side &&
    details?.drink &&
    details?.iceLevel
  );
}

/**
 * Determine missing meal components
 */
export function getMissingMealComponents(item: PendingOrderItem): string[] {
  if (!item.isMeal) return [];

  const missing: string[] = [];
  const details = item.mealDetails;

  if (!details?.size) missing.push('size');
  if (!details?.side) missing.push('side');
  if (!details?.drink) missing.push('drink');
  if (!details?.iceLevel) missing.push('ice');

  return missing;
}

/**
 * Parse meal size from user input
 */
export function parseMealSize(text: string): 'medium' | 'large' | null {
  const lowerText = text.toLowerCase();

  if (/\b(large|big|l)\b/i.test(lowerText)) {
    return 'large';
  }

  if (/\b(medium|med|regular|m)\b/i.test(lowerText)) {
    return 'medium';
  }

  return null;
}

/**
 * Parse ice level from user input
 */
export function parseIceLevel(text: string): 'none' | 'less' | 'full' | null {
  const lowerText = text.toLowerCase();

  if (/\b(no ice|without ice|none|no)\b/i.test(lowerText)) {
    return 'none';
  }

  if (/\b(less ice|little ice|light ice|less)\b/i.test(lowerText)) {
    return 'less';
  }

  if (/\b(full ice|normal ice|regular ice|full|yes)\b/i.test(lowerText)) {
    return 'full';
  }

  return null;
}

/**
 * Available meal sides (with pricing)
 */
export const MEAL_SIDES = [
  { id: 'fries', name: 'Fries', priceModifier: 0 },
  { id: 'corn', name: 'Corn Cup', priceModifier: 0 },
  { id: 'salad', name: 'Garden Salad', priceModifier: 0.50 },
];

/**
 * Available meal drinks (with pricing)
 */
export const MEAL_DRINKS = [
  { id: 'coke', name: 'Coke', priceModifier: 0 },
  { id: 'sprite', name: 'Sprite', priceModifier: 0 },
  { id: 'fanta', name: 'Fanta', priceModifier: 0 },
  { id: 'milo', name: 'Milo', priceModifier: 0 },
  { id: 'orange-juice', name: 'Orange Juice', priceModifier: 0.50 },
  { id: 'water', name: 'Water', priceModifier: 0 },
];

/**
 * Find side by name (fuzzy match)
 */
export function findSideByName(text: string): typeof MEAL_SIDES[0] | null {
  const lowerText = text.toLowerCase();

  for (const side of MEAL_SIDES) {
    if (lowerText.includes(side.name.toLowerCase()) ||
        lowerText.includes(side.id)) {
      return side;
    }
  }

  // Fuzzy matches
  if (/\b(fries|french fries|chips)\b/i.test(lowerText)) {
    return MEAL_SIDES[0]; // Fries
  }
  if (/\b(corn|corn cup)\b/i.test(lowerText)) {
    return MEAL_SIDES[1]; // Corn
  }
  if (/\b(salad|garden salad)\b/i.test(lowerText)) {
    return MEAL_SIDES[2]; // Salad
  }

  return null;
}

/**
 * Find drink by name (fuzzy match)
 */
export function findDrinkByName(text: string): typeof MEAL_DRINKS[0] | null {
  const lowerText = text.toLowerCase();

  for (const drink of MEAL_DRINKS) {
    if (lowerText.includes(drink.name.toLowerCase()) ||
        lowerText.includes(drink.id)) {
      return drink;
    }
  }

  // Fuzzy matches
  if (/\b(coke|coca cola|cola)\b/i.test(lowerText)) {
    return MEAL_DRINKS[0]; // Coke
  }
  if (/\b(sprite)\b/i.test(lowerText)) {
    return MEAL_DRINKS[1]; // Sprite
  }
  if (/\b(fanta|orange soda)\b/i.test(lowerText)) {
    return MEAL_DRINKS[2]; // Fanta
  }
  if (/\b(milo)\b/i.test(lowerText)) {
    return MEAL_DRINKS[3]; // Milo
  }
  if (/\b(orange juice|oj)\b/i.test(lowerText)) {
    return MEAL_DRINKS[4]; // Orange Juice
  }
  if (/\b(water)\b/i.test(lowerText)) {
    return MEAL_DRINKS[5]; // Water
  }

  return null;
}
