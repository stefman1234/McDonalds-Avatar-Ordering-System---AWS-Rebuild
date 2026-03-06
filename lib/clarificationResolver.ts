import type { MenuItemDTO, ClarificationType } from "@/lib/types";

interface ClarificationResult {
  resolved: boolean;
  item?: MenuItemDTO;
  size?: string;
  dismissed?: boolean;
}

const ORDINALS: Record<string, number> = {
  "first": 0, "1": 0, "one": 0, "number 1": 0, "the first": 0, "the first one": 0,
  "second": 1, "2": 1, "two": 1, "number 2": 1, "the second": 1, "the second one": 1,
  "third": 2, "3": 2, "three": 2, "number 3": 2, "the third": 2, "the third one": 2,
  "fourth": 3, "4": 3, "four": 3, "number 4": 3, "the fourth": 3, "the fourth one": 3,
  "fifth": 4, "5": 4, "five": 4, "number 5": 4, "the fifth": 4, "the fifth one": 4,
};

const DISMISS_PHRASES = [
  "none", "none of these", "never mind", "nevermind", "no",
  "cancel", "forget it", "nothing", "skip",
];

const SIZE_MAP: Record<string, string> = {
  "small": "Small", "sm": "Small",
  "medium": "Medium", "med": "Medium", "regular": "Medium",
  "large": "Large", "lg": "Large", "big": "Large",
};

// Normalize special chars for matching: "M&M'S" → "m m s", "M and Ms" → "m and ms"
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")  // M&M → M and M
    .replace(/[''\u2019]/g, "") // strip apostrophes
    .replace(/[^a-z0-9\s]/g, " ") // strip remaining special chars
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveClarification(
  transcript: string,
  candidates: MenuItemDTO[],
  type: ClarificationType
): ClarificationResult {
  const lower = transcript.toLowerCase().trim();

  // Check dismiss phrases
  if (DISMISS_PHRASES.some((p) => lower === p || lower.includes(p))) {
    return { resolved: true, dismissed: true };
  }

  // Size resolution for size_needed type
  if (type === "size_needed") {
    for (const [key, size] of Object.entries(SIZE_MAP)) {
      if (lower === key || lower.includes(key)) {
        return { resolved: true, size };
      }
    }
    return { resolved: false };
  }

  // Ordinal matching: "the first one", "number 2", etc.
  for (const [phrase, index] of Object.entries(ORDINALS)) {
    if (lower === phrase || lower.includes(phrase)) {
      if (index < candidates.length) {
        return { resolved: true, item: candidates[index] };
      }
    }
  }

  // Name matching: check if the transcript contains a candidate name
  for (const candidate of candidates) {
    const candidateLower = candidate.name.toLowerCase();
    if (lower.includes(candidateLower) || candidateLower.includes(lower)) {
      return { resolved: true, item: candidate };
    }
  }

  // Normalized matching: handles "M and Ms" → "McFlurry with M&M'S", special chars, etc.
  const normalizedInput = normalize(transcript);
  for (const candidate of candidates) {
    const normalizedCandidate = normalize(candidate.name);
    if (normalizedInput.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedInput)) {
      return { resolved: true, item: candidate };
    }
  }

  // Keyword matching: check if user's distinctive words appear in candidate name
  // e.g., "M and Ms" → words ["m", "and", "ms"] — "ms" matches part of "m&m's" normalized to "m and m s"
  const inputWords = normalizedInput.split(" ").filter((w) => w.length >= 2);
  if (inputWords.length > 0) {
    let bestMatch: { candidate: MenuItemDTO; score: number } | null = null;
    for (const candidate of candidates) {
      const normalizedName = normalize(candidate.name);
      const nameWords = normalizedName.split(" ");
      // Count how many input words match (substring) any name word
      const matchCount = inputWords.filter((iw) =>
        nameWords.some((nw) => nw.includes(iw) || iw.includes(nw))
      ).length;
      const score = matchCount / inputWords.length;
      if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { candidate, score };
      }
    }
    if (bestMatch) {
      return { resolved: true, item: bestMatch.candidate };
    }
  }

  // Partial word matching for short inputs
  if (lower.length >= 3) {
    for (const candidate of candidates) {
      const words = candidate.name.toLowerCase().split(/\s+/);
      if (words.some((w) => w.startsWith(lower) || lower.startsWith(w))) {
        return { resolved: true, item: candidate };
      }
    }
  }

  return { resolved: false };
}
