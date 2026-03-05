import Fuse from "fuse.js";
import type { MenuItemDTO } from "@/lib/types";

interface FuzzyMatch {
  item: MenuItemDTO;
  score: number;
}

export function fuzzyMatchMenuItem(
  query: string,
  menu: MenuItemDTO[]
): FuzzyMatch | null {
  const normalizedQuery = query.toLowerCase().trim();

  // Stage 1: Exact alias match
  for (const item of menu) {
    if (item.aliases.some((a) => a.toLowerCase() === normalizedQuery)) {
      return { item, score: 1.0 };
    }
  }

  // Stage 2: Exact name match (case insensitive)
  for (const item of menu) {
    if (item.name.toLowerCase() === normalizedQuery) {
      return { item, score: 1.0 };
    }
  }

  // Stage 3: Name contains query or query contains name
  for (const item of menu) {
    const nameLower = item.name.toLowerCase();
    if (nameLower.includes(normalizedQuery) || normalizedQuery.includes(nameLower)) {
      return { item, score: 0.85 };
    }
  }

  // Stage 4: Fuse.js fuzzy search on name + aliases
  const fuseItems = menu.map((item) => ({
    ...item,
    searchText: [item.name, ...item.aliases].join(" "),
  }));

  const fuse = new Fuse(fuseItems, {
    keys: ["searchText", "name"],
    threshold: 0.4,
    includeScore: true,
  });

  const results = fuse.search(normalizedQuery);
  if (results.length > 0 && results[0].score !== undefined) {
    return {
      item: results[0].item,
      score: 1 - results[0].score, // Fuse score is 0=perfect, 1=worst
    };
  }

  return null;
}

/**
 * Return multiple fuzzy matches (for ambiguous queries / clarification).
 */
export function fuzzySearchAll(
  query: string,
  menu: MenuItemDTO[],
  maxResults: number = 5
): { item: MenuItemDTO; score: number }[] {
  const normalizedQuery = query.toLowerCase().trim();

  const fuseItems = menu.map((item) => ({
    ...item,
    searchText: [item.name, ...item.aliases, item.description ?? ""].join(" "),
  }));

  const fuse = new Fuse(fuseItems, {
    keys: ["searchText", "name"],
    threshold: 0.5,
    includeScore: true,
  });

  return fuse
    .search(normalizedQuery)
    .slice(0, maxResults)
    .map((result) => ({
      item: result.item,
      score: result.score !== undefined ? 1 - result.score : 0.5,
    }));
}
