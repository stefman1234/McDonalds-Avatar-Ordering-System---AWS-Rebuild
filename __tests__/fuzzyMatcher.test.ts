import { fuzzyMatchMenuItem, fuzzySearchAll } from "@/lib/utils/fuzzyMatcher";
import { mockMenuItems } from "./fixtures";

describe("fuzzyMatchMenuItem", () => {
  it("exact name match returns score 1.0", () => {
    const result = fuzzyMatchMenuItem("Big Mac", mockMenuItems);
    expect(result).not.toBeNull();
    expect(result!.item.name).toBe("Big Mac");
    expect(result!.score).toBe(1.0);
  });

  it("exact alias match returns score 1.0", () => {
    const result = fuzzyMatchMenuItem("bigmac", mockMenuItems);
    expect(result).not.toBeNull();
    expect(result!.item.name).toBe("Big Mac");
    expect(result!.score).toBe(1.0);
  });

  it("case insensitive match", () => {
    const result = fuzzyMatchMenuItem("big mac", mockMenuItems);
    expect(result).not.toBeNull();
    expect(result!.item.name).toBe("Big Mac");
  });

  it("partial name match (contains)", () => {
    const result = fuzzyMatchMenuItem("quarter pounder", mockMenuItems);
    expect(result).not.toBeNull();
    expect(result!.item.name).toBe("Quarter Pounder with Cheese");
    // Matches via alias "quarter pounder" → score 1.0, or contains → 0.85
    expect(result!.score).toBeGreaterThanOrEqual(0.85);
  });

  it("fuzzy match for misspelling", () => {
    const result = fuzzyMatchMenuItem("big mak", mockMenuItems);
    expect(result).not.toBeNull();
    expect(result!.item.name).toBe("Big Mac");
    expect(result!.score).toBeGreaterThan(0.5);
  });

  it("alias-based fuzzy match for nuggets", () => {
    const result = fuzzyMatchMenuItem("nuggets", mockMenuItems);
    expect(result).not.toBeNull();
    expect(result!.item.name).toContain("McNuggets");
  });

  it("returns null for completely unrelated query", () => {
    const result = fuzzyMatchMenuItem("pizza pepperoni", mockMenuItems);
    expect(result).toBeNull();
  });

  it("trims and lowercases input", () => {
    const result = fuzzyMatchMenuItem("  MCCHICKEN  ", mockMenuItems);
    expect(result).not.toBeNull();
    expect(result!.item.name).toBe("McChicken");
  });
});

describe("fuzzySearchAll", () => {
  it("returns multiple results for broad query", () => {
    const results = fuzzySearchAll("chicken", mockMenuItems, 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.item.name.includes("Chicken"))).toBe(true);
  });

  it("respects maxResults limit", () => {
    const results = fuzzySearchAll("mc", mockMenuItems, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("returns empty array for nonsense query", () => {
    const results = fuzzySearchAll("xyzabc123", mockMenuItems, 5);
    expect(results.length).toBe(0);
  });

  it("scores are between 0 and 1", () => {
    const results = fuzzySearchAll("big mac", mockMenuItems, 5);
    for (const r of results) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    }
  });
});
