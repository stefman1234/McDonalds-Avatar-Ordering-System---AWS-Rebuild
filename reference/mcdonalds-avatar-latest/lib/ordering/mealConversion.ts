/**
 * Meal Conversion Logic
 * Detects meal-eligible items and offers meal conversions
 */

import type { ParsedOrderItem } from '@/lib/nlp/orderProcessor';
import type { PendingOrderItem } from '@/lib/state/pendingOrderManager';
import { findSideByName, findDrinkByName, parseIceLevel } from './mealCustomizationFlow';

/**
 * Categories that are meal-eligible
 * Typically burgers, chicken, and fish items
 */
const MEAL_ELIGIBLE_CATEGORIES = [
  'burgers',
  'chicken',
  'fish',
  'breakfast', // Some breakfast items can be meals
];

/**
 * Meal-eligible keywords in item names
 */
const MEAL_ELIGIBLE_KEYWORDS = [
  'big mac',
  'quarter pounder',
  'mcchicken',
  'filet-o-fish',
  'cheeseburger',
  'hamburger',
  'chicken',
  'nuggets',
  'spicy',
];

/**
 * Check if an item is meal-eligible
 */
export function isMealEligible(item: ParsedOrderItem | any): boolean {
  // Check category
  if (item.category && MEAL_ELIGIBLE_CATEGORIES.includes(item.category.toLowerCase())) {
    return true;
  }

  // Check item name for keywords
  const itemName = item.name.toLowerCase();
  return MEAL_ELIGIBLE_KEYWORDS.some(keyword => itemName.includes(keyword));
}

/**
 * Check if order contains meal-eligible items (excluding already-meal items)
 */
export function hasMealEligibleItems(items: ParsedOrderItem[]): boolean {
  return items.some(item => !item.isMeal && isMealEligible(item));
}

/**
 * Get meal-eligible items from order
 */
export function getMealEligibleItems(items: ParsedOrderItem[]): ParsedOrderItem[] {
  return items.filter(item => !item.isMeal && isMealEligible(item));
}

/**
 * Generate meal conversion offer message
 */
export function generateMealConversionOffer(items: ParsedOrderItem[]): string {
  const eligibleItems = getMealEligibleItems(items);

  if (eligibleItems.length === 0) {
    return '';
  }

  if (eligibleItems.length === 1) {
    const item = eligibleItems[0];
    return `Would you like your ${item.name} solo or as a medium or large meal?`;
  }

  // Multiple eligible items
  const itemNames = eligibleItems.map(item => item.name).join(', ');
  return `Great! I've added ${itemNames}. Would you like to make any of these a meal?`;
}

/**
 * Convert a ParsedOrderItem to PendingOrderItem (for meal customization)
 */
export function convertToPendingItem(item: ParsedOrderItem, isMeal: boolean = false): PendingOrderItem {
  return {
    menuItemId: item.menuItemId,
    name: item.name,
    basePrice: item.basePrice,
    quantity: item.quantity,
    isMeal,
    mealDetails: isMeal ? {} : undefined,
    isComplete: !isMeal, // Regular items are complete immediately
  };
}

/**
 * Convert specific item to meal in pending order
 */
export function convertItemToMeal(
  items: PendingOrderItem[],
  itemIndex: number
): PendingOrderItem[] {
  const updatedItems = [...items];
  if (itemIndex >= 0 && itemIndex < updatedItems.length) {
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      isMeal: true,
      mealDetails: {},
      isComplete: false,
    };
  }
  return updatedItems;
}

/**
 * Meal details that can be extracted from acceptance response
 */
export interface MealDetailsFromAcceptance {
  size?: 'medium' | 'large';
  side?: {
    id: string;
    name: string;
    priceModifier: number;
  };
  drink?: {
    id: string;
    name: string;
    priceModifier: number;
  };
  iceLevel?: 'none' | 'less' | 'full';
}

/**
 * Parse meal details from user's acceptance response
 * Extracts size, side, drink, and ice level if mentioned
 */
export function parseMealDetailsFromAcceptance(userText: string): MealDetailsFromAcceptance {
  const details: MealDetailsFromAcceptance = {};

  // Parse size
  if (/\b(large|big|l)\b/i.test(userText)) {
    details.size = 'large';
  } else if (/\b(medium|med|regular|m)\b/i.test(userText)) {
    details.size = 'medium';
  }

  // Parse side
  const side = findSideByName(userText);
  if (side) {
    details.side = side;
  }

  // Parse drink
  const drink = findDrinkByName(userText);
  if (drink) {
    details.drink = drink;
  }

  // Parse ice level
  const iceLevel = parseIceLevel(userText);
  if (iceLevel) {
    details.iceLevel = iceLevel;
  }

  return details;
}

/**
 * Detect if user is answering meal conversion offer
 * Returns: { accepted: boolean, itemIndex?: number, mealDetails?: MealDetailsFromAcceptance }
 */
export function parseMealConversionResponse(
  userText: string,
  eligibleItems: ParsedOrderItem[]
): { accepted: boolean; itemIndex?: number; mealDetails?: MealDetailsFromAcceptance } {
  const lowerText = userText.toLowerCase();

  // Check for solo/no meal rejection
  if (
    /\b(solo|no|nope|nah|no thanks|skip|not now|just (the|that)|no meal|single)\b/i.test(lowerText)
  ) {
    return { accepted: false };
  }

  // Parse meal details from acceptance response
  const mealDetails = parseMealDetailsFromAcceptance(userText);

  // Check for medium meal
  if (/\b(medium|med|m)\b/i.test(lowerText)) {
    if (eligibleItems.length === 1) {
      return { accepted: true, itemIndex: 0, mealDetails };
    }
    // Multiple items - try to match specific item
    for (let i = 0; i < eligibleItems.length; i++) {
      const item = eligibleItems[i];
      const itemName = item.name.toLowerCase();
      if (lowerText.includes(itemName)) {
        return { accepted: true, itemIndex: i, mealDetails };
      }
    }
    return { accepted: true, mealDetails };
  }

  // Check for large meal
  if (/\b(large|big|l)\b/i.test(lowerText)) {
    if (eligibleItems.length === 1) {
      return { accepted: true, itemIndex: 0, mealDetails };
    }
    // Multiple items - try to match specific item
    for (let i = 0; i < eligibleItems.length; i++) {
      const item = eligibleItems[i];
      const itemName = item.name.toLowerCase();
      if (lowerText.includes(itemName)) {
        return { accepted: true, itemIndex: i, mealDetails };
      }
    }
    return { accepted: true, mealDetails };
  }

  // Check for generic acceptance (yes/yeah/sure)
  const acceptancePatterns = /\b(yes|yeah|yep|sure|ok|okay|make it a meal|all of them|everything)\b/i;
  if (acceptancePatterns.test(lowerText)) {
    // If only one eligible item, accept it
    if (eligibleItems.length === 1) {
      return { accepted: true, itemIndex: 0, mealDetails };
    }

    // Try to match specific item name
    for (let i = 0; i < eligibleItems.length; i++) {
      const item = eligibleItems[i];
      const itemName = item.name.toLowerCase();
      if (lowerText.includes(itemName)) {
        return { accepted: true, itemIndex: i, mealDetails };
      }
    }

    // Generic acceptance - ask user to specify which item
    return { accepted: true, mealDetails };
  }

  // Default: rejection
  return { accepted: false };
}
