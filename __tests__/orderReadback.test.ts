import { buildOrderReadback, buildAddConfirmation } from "@/lib/orderReadback";
import { makeCartItem } from "./fixtures";

describe("buildOrderReadback", () => {
  it("returns empty message for no items", () => {
    const result = buildOrderReadback([]);
    expect(result).toContain("empty");
  });

  it("single item readback", () => {
    const items = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 5.99 }),
    ];
    const result = buildOrderReadback(items);
    expect(result).toContain("Big Mac");
    expect(result).toContain("$");
    expect(result).toContain("place the order");
  });

  it("two items uses 'and'", () => {
    const items = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 5.99 }),
      makeCartItem({ menuItemId: 4, name: "Medium Fries", unitPrice: 3.49, id: "4-" }),
    ];
    const result = buildOrderReadback(items);
    expect(result).toContain("Big Mac and Medium Fries");
  });

  it("three+ items uses Oxford comma", () => {
    const items = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 5.99 }),
      makeCartItem({ menuItemId: 4, name: "Medium Fries", unitPrice: 3.49, id: "4-" }),
      makeCartItem({ menuItemId: 5, name: "Medium Coke", unitPrice: 2.49, id: "5-" }),
    ];
    const result = buildOrderReadback(items);
    expect(result).toContain(", and ");
  });

  it("includes quantity for items with qty > 1", () => {
    const items = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 5.99, quantity: 3 }),
    ];
    const result = buildOrderReadback(items);
    expect(result).toContain("3 Big Mac");
  });

  it("includes customizations", () => {
    const items = [
      makeCartItem({
        menuItemId: 1,
        name: "Big Mac",
        unitPrice: 5.99,
        customizations: ["No Pickles", "Extra Sauce"],
      }),
    ];
    const result = buildOrderReadback(items);
    expect(result).toContain("No Pickles");
    expect(result).toContain("Extra Sauce");
  });

  it("total includes tax", () => {
    const items = [
      makeCartItem({ menuItemId: 1, name: "Big Mac", unitPrice: 10.0 }),
    ];
    const result = buildOrderReadback(items);
    // Tax is 8.25%, so total should be $10.83
    expect(result).toContain("$10.83");
  });
});

describe("buildAddConfirmation", () => {
  it("returns empty string for no items", () => {
    expect(buildAddConfirmation([])).toBe("");
  });

  it("single item confirmation", () => {
    const result = buildAddConfirmation(["Big Mac"]);
    expect(result).toContain("Big Mac");
    expect(result).toContain("added");
    expect(result).toContain("Anything else");
  });

  it("two items confirmation", () => {
    const result = buildAddConfirmation(["Big Mac", "Fries"]);
    expect(result).toContain("Big Mac and Fries");
  });

  it("three+ items confirmation with Oxford comma", () => {
    const result = buildAddConfirmation(["Big Mac", "Fries", "Coke"]);
    expect(result).toContain(", and ");
  });
});
