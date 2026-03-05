import { compressMenuForPrompt } from "@/lib/nlp/compressMenu";
import { mockCategories } from "./fixtures";

describe("compressMenuForPrompt", () => {
  it("returns a non-empty string", () => {
    const result = compressMenuForPrompt(mockCategories);
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes all category names", () => {
    const result = compressMenuForPrompt(mockCategories);
    expect(result).toContain("Burgers");
    expect(result).toContain("Chicken & Fish");
    expect(result).toContain("Fries");
    expect(result).toContain("Drinks");
    expect(result).toContain("Desserts");
  });

  it("includes prices with $ prefix", () => {
    const result = compressMenuForPrompt(mockCategories);
    expect(result).toContain("$5.99");
    expect(result).toContain("$3.49");
  });

  it("abbreviates known items", () => {
    const result = compressMenuForPrompt(mockCategories);
    // "Quarter Pounder" should be abbreviated to "QP"
    expect(result).toContain("QP");
    // "Chicken McNuggets" should be abbreviated to "McNuggets"
    expect(result).toContain("McNuggets");
  });

  it("uses bracket format for categories", () => {
    const result = compressMenuForPrompt(mockCategories);
    // Format: CategoryName[item1,item2]
    expect(result).toMatch(/Burgers\[.+\]/);
  });

  it("handles empty categories", () => {
    const result = compressMenuForPrompt([
      { id: 1, name: "Empty", sortOrder: 1, items: [] },
    ]);
    expect(result).toBe("Empty[]");
  });

  it("is shorter than raw JSON", () => {
    const compressed = compressMenuForPrompt(mockCategories);
    const raw = JSON.stringify(mockCategories);
    expect(compressed.length).toBeLessThan(raw.length);
  });
});
