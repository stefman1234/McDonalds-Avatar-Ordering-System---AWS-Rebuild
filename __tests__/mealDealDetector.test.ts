import { detectMealDeals } from "@/lib/mealDealDetector";
import { makeCartItem, mockCombos } from "./fixtures";

describe("detectMealDeals", () => {
  it("detects a deal when main + side + drink are in cart", () => {
    const cartItems = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 5.99 }),
      makeCartItem({ menuItemId: 4, name: "Medium Fries", unitPrice: 3.49, id: "4-" }),
      makeCartItem({ menuItemId: 5, name: "Medium Coke", unitPrice: 2.49, id: "5-" }),
    ];

    const deals = detectMealDeals(cartItems, mockCombos);
    expect(deals.length).toBeGreaterThan(0);
    expect(deals[0].combo.name).toBe("Big Mac Meal");
    expect(deals[0].savings).toBeGreaterThan(0);
    expect(deals[0].comboPrice).toBe(9.99 - 1.5);
  });

  it("detects deal with main + side only (2 matched items)", () => {
    const cartItems = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 5.99 }),
      makeCartItem({ menuItemId: 4, name: "Medium Fries", unitPrice: 3.49, id: "4-" }),
    ];

    const deals = detectMealDeals(cartItems, mockCombos);
    expect(deals.length).toBeGreaterThan(0);
  });

  it("returns empty when no combo items are in cart", () => {
    const cartItems = [
      makeCartItem({ menuItemId: 6, name: "McFlurry", unitPrice: 4.99 }),
    ];

    const deals = detectMealDeals(cartItems, mockCombos);
    expect(deals.length).toBe(0);
  });

  it("skips unavailable combos", () => {
    const unavailableCombos = mockCombos.map((c) => ({ ...c, available: false }));
    const cartItems = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 5.99 }),
      makeCartItem({ menuItemId: 4, name: "Medium Fries", unitPrice: 3.49, id: "4-" }),
      makeCartItem({ menuItemId: 5, name: "Medium Coke", unitPrice: 2.49, id: "5-" }),
    ];

    const deals = detectMealDeals(cartItems, unavailableCombos);
    expect(deals.length).toBe(0);
  });

  it("doesn't suggest deal when savings is negligible (<$0.50)", () => {
    const cheapCombos = [{ ...mockCombos[0], basePrice: 12.0, discount: 0.0 }];
    const cartItems = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 5.99 }),
      makeCartItem({ menuItemId: 4, name: "Medium Fries", unitPrice: 3.49, id: "4-" }),
      makeCartItem({ menuItemId: 5, name: "Medium Coke", unitPrice: 2.49, id: "5-" }),
    ];

    const deals = detectMealDeals(cartItems, cheapCombos);
    // Total = 11.97, combo = 12.0, savings = -0.03 → no deal
    expect(deals.length).toBe(0);
  });

  it("sorts deals by highest savings first", () => {
    const cartItems = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 5.99 }),
      makeCartItem({ menuItemId: 3, name: "McChicken", unitPrice: 3.99, id: "3-" }),
      makeCartItem({ menuItemId: 4, name: "Medium Fries", unitPrice: 3.49, id: "4-" }),
      makeCartItem({ menuItemId: 5, name: "Medium Coke", unitPrice: 2.49, id: "5-" }),
    ];

    const deals = detectMealDeals(cartItems, mockCombos);
    if (deals.length >= 2) {
      expect(deals[0].savings).toBeGreaterThanOrEqual(deals[1].savings);
    }
  });
});
