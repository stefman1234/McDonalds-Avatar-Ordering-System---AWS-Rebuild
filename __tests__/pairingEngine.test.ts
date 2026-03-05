import { getSuggestions, buildSuggestionPrompt } from "@/lib/pairingEngine";
import { makeCartItem, mockMenuItems } from "./fixtures";

describe("getSuggestions", () => {
  it("returns empty for empty cart", () => {
    expect(getSuggestions([], mockMenuItems)).toEqual([]);
  });

  it("suggests fries/drinks for burger order", () => {
    const cartItems = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 5.99 }),
    ];
    const suggestions = getSuggestions(cartItems, mockMenuItems);
    expect(suggestions.length).toBeGreaterThan(0);
    // Should suggest from Fries, Drinks, or Desserts (Burger pairings)
    const suggestedCats = suggestions.map((s) => s.categoryName);
    expect(
      suggestedCats.some((c) => ["Fries", "Drinks", "Desserts"].includes(c))
    ).toBe(true);
  });

  it("does not suggest items already in cart", () => {
    const cartItems = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 5.99 }),
      makeCartItem({ menuItemId: 4, name: "Medium Fries", unitPrice: 3.49, id: "4-" }),
    ];
    const suggestions = getSuggestions(cartItems, mockMenuItems);
    const ids = suggestions.map((s) => s.id);
    expect(ids).not.toContain(1);
    expect(ids).not.toContain(4);
  });

  it("does not suggest from same category already ordered", () => {
    const cartItems = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 5.99 }),
    ];
    const suggestions = getSuggestions(cartItems, mockMenuItems);
    // Should not suggest other burgers
    expect(suggestions.every((s) => s.categoryName !== "Burgers")).toBe(true);
  });

  it("respects maxSuggestions limit", () => {
    const cartItems = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 5.99 }),
    ];
    const suggestions = getSuggestions(cartItems, mockMenuItems, 1);
    expect(suggestions.length).toBeLessThanOrEqual(1);
  });

  it("only suggests available items", () => {
    const cartItems = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 5.99 }),
    ];
    const suggestions = getSuggestions(cartItems, mockMenuItems);
    expect(suggestions.every((s) => s.available)).toBe(true);
  });
});

describe("buildSuggestionPrompt", () => {
  it("returns null for empty suggestions", () => {
    expect(buildSuggestionPrompt([], [])).toBeNull();
  });

  it("suggests fries when not in cart", () => {
    const suggestions = mockMenuItems.filter((i) => i.categoryName === "Fries");
    const result = buildSuggestionPrompt(suggestions, ["Burgers"]);
    expect(result).toContain("fries");
  });

  it("suggests drink when no drink in cart", () => {
    const suggestions = mockMenuItems.filter((i) => i.categoryName === "Drinks");
    const result = buildSuggestionPrompt(suggestions, ["Burgers", "Fries"]);
    expect(result).toContain("drink");
  });

  it("suggests specific item when fries + drink are present", () => {
    const suggestions = mockMenuItems.filter((i) => i.categoryName === "Desserts");
    const result = buildSuggestionPrompt(suggestions, ["Burgers", "Fries", "Drinks"]);
    expect(result).not.toBeNull();
    expect(result).toContain(suggestions[0].name);
  });
});
