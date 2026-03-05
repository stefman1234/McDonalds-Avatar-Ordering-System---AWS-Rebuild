/**
 * Pending Order State Management
 * Handles multi-step meal customization flows
 */

export type MealCustomizationStep =
  | 'meal_size'
  | 'meal_side'
  | 'meal_drink'
  | 'ice_level'
  | 'meal_conversion_offer'
  | 'complete';

export type OrderType =
  | 'single'
  | 'meal'
  | 'multiple_items'
  | 'multiple_meals';

export interface PendingOrderItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  isMeal: boolean;
  mealDetails?: {
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
  };
  isComplete: boolean;
}

export interface PendingOrder {
  type: OrderType;
  currentStep: MealCustomizationStep;
  items: PendingOrderItem[];
  currentItemIndex: number;
  awaitingResponse: boolean;
  lastQuestion: string;
  offeringMealConversion?: boolean;
  mealEligibleIndexes?: number[]; // Indexes of meal-eligible items
}

/**
 * Pending Order Manager
 * Manages state for multi-step meal customization
 */
export class PendingOrderManager {
  private state: PendingOrder | null = null;

  /**
   * Initialize a new pending order
   */
  initialize(type: OrderType, items: PendingOrderItem[]): void {
    this.state = {
      type,
      currentStep: 'meal_size',
      items,
      currentItemIndex: 0,
      awaitingResponse: false,
      lastQuestion: '',
    };
  }

  /**
   * Get current state
   */
  getState(): PendingOrder | null {
    return this.state;
  }

  /**
   * Check if there's an active pending order
   */
  hasPendingOrder(): boolean {
    return this.state !== null;
  }

  /**
   * Get current item being customized
   */
  getCurrentItem(): PendingOrderItem | null {
    if (!this.state || this.state.currentItemIndex >= this.state.items.length) {
      return null;
    }
    return this.state.items[this.state.currentItemIndex];
  }

  /**
   * Update current item's meal details
   */
  updateCurrentItemMealDetails(updates: Partial<PendingOrderItem['mealDetails']>): void {
    if (!this.state) return;

    const currentItem = this.getCurrentItem();
    if (!currentItem) return;

    currentItem.mealDetails = {
      ...currentItem.mealDetails,
      ...updates,
    };
  }

  /**
   * Move to next customization step
   */
  nextStep(): MealCustomizationStep {
    if (!this.state) return 'complete';

    const currentItem = this.getCurrentItem();
    if (!currentItem || !currentItem.isMeal) return 'complete';

    // Determine next step based on what's missing
    const details = currentItem.mealDetails;

    if (!details?.size) {
      this.state.currentStep = 'meal_size';
    } else if (!details?.side) {
      this.state.currentStep = 'meal_side';
    } else if (!details?.drink) {
      this.state.currentStep = 'meal_drink';
    } else if (!details?.iceLevel) {
      this.state.currentStep = 'ice_level';
    } else {
      this.state.currentStep = 'complete';
      currentItem.isComplete = true;
    }

    return this.state.currentStep;
  }

  /**
   * Set awaiting response state
   */
  setAwaitingResponse(value: boolean, question?: string): void {
    if (!this.state) return;

    this.state.awaitingResponse = value;
    if (question) {
      this.state.lastQuestion = question;
    }
  }

  /**
   * Mark current item as complete and move to next item
   */
  completeCurrentItem(): boolean {
    if (!this.state) return false;

    const currentItem = this.getCurrentItem();
    if (currentItem) {
      currentItem.isComplete = true;
    }

    this.state.currentItemIndex++;

    // Check if there are more items to process
    return this.state.currentItemIndex < this.state.items.length;
  }

  /**
   * Check if current item's meal is complete
   */
  isCurrentItemComplete(): boolean {
    const currentItem = this.getCurrentItem();
    if (!currentItem || !currentItem.isMeal) return true;

    const details = currentItem.mealDetails;
    return !!(
      details?.size &&
      details?.side &&
      details?.drink &&
      details?.iceLevel
    );
  }

  /**
   * Get all completed items
   */
  getCompletedItems(): PendingOrderItem[] {
    if (!this.state) return [];
    return this.state.items.filter(item => item.isComplete);
  }

  /**
   * Clear pending order state
   */
  clear(): void {
    this.state = null;
  }

  /**
   * Check if all items are complete
   */
  isAllComplete(): boolean {
    if (!this.state) return false;
    return this.state.items.every(item => item.isComplete);
  }

  /**
   * Set meal conversion offer state
   */
  setOfferingMealConversion(offering: boolean, eligibleIndexes?: number[]): void {
    if (!this.state) return;
    this.state.offeringMealConversion = offering;
    this.state.mealEligibleIndexes = eligibleIndexes;
  }

  /**
   * Check if currently offering meal conversion
   */
  isOfferingMealConversion(): boolean {
    return this.state?.offeringMealConversion || false;
  }

  /**
   * Convert specific item to meal
   */
  convertItemToMeal(itemIndex: number): void {
    if (!this.state || itemIndex < 0 || itemIndex >= this.state.items.length) {
      return;
    }

    const item = this.state.items[itemIndex];
    item.isMeal = true;
    item.mealDetails = {};
    item.isComplete = false;

    // Set this as current item for customization
    this.state.currentItemIndex = itemIndex;
    this.state.currentStep = 'meal_size';
    this.state.offeringMealConversion = false;
  }

  /**
   * Get meal eligible item indexes
   */
  getMealEligibleIndexes(): number[] {
    return this.state?.mealEligibleIndexes || [];
  }

  /**
   * Get remaining meal-eligible items that haven't been converted yet
   */
  getRemainingMealEligibleIndexes(): number[] {
    if (!this.state?.mealEligibleIndexes) return [];

    return this.state.mealEligibleIndexes.filter(idx => {
      const item = this.state!.items[idx];
      return item && !item.isMeal; // Still eligible and not converted
    });
  }

  /**
   * Get all non-meal items (regular items)
   */
  getNonMealItems(): PendingOrderItem[] {
    if (!this.state) return [];
    return this.state.items.filter(item => !item.isMeal);
  }

  /**
   * Check if there are remaining non-meal items that need to be added to cart
   */
  hasRemainingNonMealItems(): boolean {
    if (!this.state) return false;
    return this.state.items.some((item, idx) =>
      !item.isMeal && !item.isComplete && idx !== this.state!.currentItemIndex
    );
  }
}

/**
 * Singleton instance
 */
export const pendingOrderManager = new PendingOrderManager();
