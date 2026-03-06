import type { MealSideOption, MealDrinkOption } from "@/lib/types";

export type MealCustomizationStep =
  | "meal_size"
  | "meal_side"
  | "meal_drink"
  | "ice_level"
  | "meal_conversion_offer"
  | "complete";

export type OrderType = "single" | "meal" | "multiple_items" | "multiple_meals";

export interface PendingOrderItem {
  menuItemId: number;
  name: string;
  basePrice: number;
  quantity: number;
  isMeal: boolean;
  mealDetails?: {
    size?: "medium" | "large";
    side?: MealSideOption;
    drink?: MealDrinkOption;
    iceLevel?: "none" | "less" | "full";
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
  mealEligibleIndexes?: number[];
}

class PendingOrderManagerClass {
  private state: PendingOrder | null = null;

  initialize(type: OrderType, items: PendingOrderItem[]): void {
    this.state = {
      type,
      currentStep: "meal_size",
      items,
      currentItemIndex: 0,
      awaitingResponse: false,
      lastQuestion: "",
    };
  }

  getState(): PendingOrder | null {
    return this.state;
  }

  hasPendingOrder(): boolean {
    return this.state !== null;
  }

  getCurrentItem(): PendingOrderItem | null {
    if (!this.state) return null;
    return this.state.items[this.state.currentItemIndex] ?? null;
  }

  updateCurrentItemMealDetails(updates: Partial<PendingOrderItem["mealDetails"]>): void {
    if (!this.state) return;
    const item = this.state.items[this.state.currentItemIndex];
    if (!item) return;
    item.mealDetails = { ...item.mealDetails, ...updates };
  }

  nextStep(): MealCustomizationStep {
    if (!this.state) return "complete";
    const item = this.getCurrentItem();
    if (!item || !item.isMeal) {
      this.state.currentStep = "complete";
      return "complete";
    }

    const details = item.mealDetails ?? {};
    if (!details.size) {
      this.state.currentStep = "meal_size";
    } else if (!details.side) {
      this.state.currentStep = "meal_side";
    } else if (!details.drink) {
      this.state.currentStep = "meal_drink";
    } else if (!details.iceLevel) {
      this.state.currentStep = "ice_level";
    } else {
      this.state.currentStep = "complete";
    }
    return this.state.currentStep;
  }

  setAwaitingResponse(awaiting: boolean, question?: string): void {
    if (!this.state) return;
    this.state.awaitingResponse = awaiting;
    if (question) this.state.lastQuestion = question;
  }

  completeCurrentItem(): { hasMore: boolean } {
    if (!this.state) return { hasMore: false };
    const item = this.getCurrentItem();
    if (item) item.isComplete = true;

    this.state.currentItemIndex++;
    const hasMore = this.state.currentItemIndex < this.state.items.length;
    if (hasMore) {
      this.nextStep();
    }
    return { hasMore };
  }

  isCurrentItemComplete(): boolean {
    const item = this.getCurrentItem();
    if (!item) return true;
    if (!item.isMeal) return true;
    const d = item.mealDetails ?? {};
    return !!(d.size && d.side && d.drink && d.iceLevel);
  }

  getCompletedItems(): PendingOrderItem[] {
    if (!this.state) return [];
    return this.state.items.filter((i) => i.isComplete);
  }

  clear(): void {
    this.state = null;
  }

  isAllComplete(): boolean {
    if (!this.state) return true;
    return this.state.items.every((i) => i.isComplete);
  }

  setOfferingMealConversion(offering: boolean, indexes?: number[]): void {
    if (!this.state) return;
    this.state.offeringMealConversion = offering;
    this.state.mealEligibleIndexes = indexes;
    if (offering) {
      this.state.currentStep = "meal_conversion_offer";
    }
  }

  isOfferingMealConversion(): boolean {
    return this.state?.offeringMealConversion ?? false;
  }

  convertItemToMeal(itemIndex: number): void {
    if (!this.state) return;
    const item = this.state.items[itemIndex];
    if (!item) return;
    item.isMeal = true;
    item.mealDetails = {};
    item.isComplete = false;
    this.state.currentItemIndex = itemIndex;
    this.state.offeringMealConversion = false;
    this.nextStep();
  }

  getMealEligibleIndexes(): number[] {
    return this.state?.mealEligibleIndexes ?? [];
  }
}

export const pendingOrderManager = new PendingOrderManagerClass();
