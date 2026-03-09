import type { CategoryDTO } from "@/lib/types";

const ABBREVIATIONS: Record<string, string> = {
  "Quarter Pounder": "QP",
  "Chicken McNuggets": "McNuggets",
  "McChicken": "McChick",
  "Filet-O-Fish": "Filet",
  "Egg McMuffin": "EggMcM",
  "Sausage McMuffin": "SausMcM",
  "Hash Browns": "HashBr",
  "Hotcakes": "HotCk",
};

function abbreviate(name: string): string {
  for (const [full, short] of Object.entries(ABBREVIATIONS)) {
    if (name.includes(full)) return name.replace(full, short);
  }
  return name;
}

/**
 * Compress menu into a token-efficient format for the NLP prompt.
 * ~60% reduction vs listing every item with full details.
 *
 * Output format:
 * Burgers[Big Mac RM5.99,QP RM6.49], Chicken[McNuggets(6/10/20),Strips RM4.99]
 */
export function compressMenuForPrompt(categories: CategoryDTO[]): string {
  return categories
    .map((cat) => {
      const items = cat.items
        .map((item) => {
          const name = abbreviate(item.name);
          return `${name} RM${item.price}`;
        })
        .join(",");
      return `${cat.name}[${items}]`;
    })
    .join(", ");
}
