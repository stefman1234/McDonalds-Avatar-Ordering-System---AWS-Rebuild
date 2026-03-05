import Fuse from 'fuse.js';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  description?: string | null;
  base_price: number;
  image_url?: string | null;
  calories?: number | null;
  available?: boolean | null;
  vegetarian?: boolean | null;
  gluten_free?: boolean | null;
  time_restriction?: string | null;
  popular?: boolean | null;
  tags?: string[] | null; // NEW: for fuzzy matching
  search_terms?: string[] | null; // NEW: for fuzzy matching
}

export interface FuzzyMatchOptions {
  keys: string[];
  threshold: number;
  limit: number;
}

/**
 * Find closest matches using Fuse.js fuzzy search
 */
export function findClosestMatches(
  query: string,
  menuItems: MenuItem[],
  options: FuzzyMatchOptions
): MenuItem[] {
  const fuse = new Fuse(menuItems, {
    keys: options.keys,
    threshold: options.threshold,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true, // Search entire string, not just beginning
    distance: 100, // How far to search for patterns
  });

  const results = fuse.search(query);
  return results.slice(0, options.limit).map((r) => r.item);
}

/**
 * Detect category from query string
 */
function detectCategory(query: string): string | null {
  const categories: Record<string, string[]> = {
    burger: ['burger', 'sandwich', 'big mac', 'quarter pounder', 'double'],
    chicken: ['chicken', 'ayam', 'nugget', 'mcnugget', 'wings', 'spicy'],
    breakfast: ['breakfast', 'morning', 'pancake', 'sausage', 'egg', 'hash brown'],
    dessert: ['dessert', 'ice cream', 'sundae', 'pie', 'cone', 'mcflurry'],
    drink: ['drink', 'beverage', 'coke', 'sprite', 'fanta', 'coffee', 'tea', 'milo', 'juice'],
    sides: ['fries', 'side', 'apple', 'salad', 'nuggets'],
  };

  const lowerQuery = query.toLowerCase();

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((kw) => lowerQuery.includes(kw))) {
      return category;
    }
  }

  return null;
}

/**
 * Main matching function with fallback strategy
 * 1. Try exact match
 * 2. Try fuzzy match (close)
 * 3. Try category match
 * 4. Try keyword match (loose)
 * 5. Fallback to popular items
 */
export function getMatches(query: string, menuItems: MenuItem[]): MenuItem[] {
  // Filter only available items
  const availableItems = menuItems.filter((item) => item.available !== false);

  // 1. Try exact match (case insensitive)
  const exactMatches = availableItems.filter(
    (item) => item.name.toLowerCase() === query.toLowerCase()
  );
  if (exactMatches.length > 0) {
    console.log(`[Fuzzy Match] Found ${exactMatches.length} exact matches for "${query}"`);
    return exactMatches;
  }

  // 2. Try fuzzy match with name, tags, and search_terms (close threshold)
  const closeMatches = findClosestMatches(query, availableItems, {
    keys: [
      'name',
      'tags',
      'search_terms',
      'subcategory',
    ],
    threshold: 0.3, // Strict - must be quite similar
    limit: 6,
  });
  if (closeMatches.length > 0) {
    console.log(`[Fuzzy Match] Found ${closeMatches.length} close matches for "${query}"`);
    return closeMatches;
  }

  // 3. Try category match if query mentions a category
  const category = detectCategory(query);
  if (category) {
    const categoryMatches = availableItems
      .filter((item) => item.category === category)
      .slice(0, 6);

    if (categoryMatches.length > 0) {
      console.log(`[Fuzzy Match] Found ${categoryMatches.length} category matches for "${query}" (category: ${category})`);
      return categoryMatches;
    }
  }

  // 4. Try loose keyword match on name and description
  const keywordMatches = findClosestMatches(query, availableItems, {
    keys: ['name', 'description', 'category'],
    threshold: 0.6, // Very loose - any vague similarity
    limit: 6,
  });
  if (keywordMatches.length > 0) {
    console.log(`[Fuzzy Match] Found ${keywordMatches.length} keyword matches for "${query}"`);
    return keywordMatches;
  }

  // 5. Fallback to popular items
  const popularItems = availableItems
    .filter((item) => item.popular === true)
    .slice(0, 6);

  console.log(`[Fuzzy Match] No matches for "${query}", showing ${popularItems.length} popular items`);
  return popularItems;
}

/**
 * Check if a query has good matches or is too vague
 */
export function hasGoodMatches(query: string, menuItems: MenuItem[]): boolean {
  const matches = getMatches(query, menuItems);

  // If we got popular items fallback, consider it a poor match
  const isPopularFallback = matches.every((item) => item.popular === true);

  return matches.length > 0 && !isPopularFallback;
}

/**
 * Get message for item not found scenario
 */
export function getItemNotFoundMessage(query: string, matches: MenuItem[]): string {
  const category = detectCategory(query);

  // No matches at all
  if (matches.length === 0) {
    return `I couldn't find "${query}" in our menu. Would you like to browse our menu instead?`;
  }

  // Category detected with matches
  if (category && matches.some((item) => item.category === category)) {
    return `I'm not sure which ${category} you'd like. Let me show you our ${category} options!`;
  }

  // Many matches (vague query)
  if (matches.length > 3) {
    return `I found several items that might be what you're looking for. Take a look!`;
  }

  // Few matches
  return `Let me show you what we have that's similar to "${query}"!`;
}
