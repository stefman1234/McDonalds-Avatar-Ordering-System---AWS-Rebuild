import { NextRequest, NextResponse } from "next/server";
import { getCachedMenu } from "@/lib/cache/menuCache";
import { processOrderSpeech } from "@/lib/nlp/orderProcessor";
import { fuzzyMatchMenuItem, fuzzySearchAll } from "@/lib/utils/fuzzyMatcher";
import { prisma } from "@/lib/db";

// Cache meal-eligible item names (refreshed every 5 min)
let mealEligibleCache: { names: string[]; ts: number } = { names: [], ts: 0 };
async function getMealEligibleItems(menu: { id: number; name: string }[]): Promise<string[]> {
  if (Date.now() - mealEligibleCache.ts < 300_000 && mealEligibleCache.names.length > 0) {
    return mealEligibleCache.names;
  }
  try {
    const combos = await prisma.comboMeal.findMany({
      where: { available: true },
      select: { mainItemId: true },
    });
    const eligibleIds = new Set(combos.map((c) => c.mainItemId));
    const names = menu.filter((m) => eligibleIds.has(m.id)).map((m) => m.name);
    mealEligibleCache = { names, ts: Date.now() };
    return names;
  } catch {
    return [];
  }
}

// A7: Pre-normalise transcript — strip STT filler words, normalise spoken numbers
function normaliseTranscript(raw: string): string {
  const FILLER = /\b(um+|uh+|hmm+|ah+|er+|like|you know|so|well|okay|ok|right|i mean|actually)\b/gi;
  const WORD_NUMS: Record<string, string> = {
    one: "1", two: "2", three: "3", four: "4", five: "5",
    six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
    eleven: "11", twelve: "12",
  };
  let s = raw.trim().replace(FILLER, " ");
  s = s.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/gi,
    (m) => WORD_NUMS[m.toLowerCase()] ?? m);
  // Collapse multiple spaces
  s = s.replace(/\s{2,}/g, " ").trim();
  return s || raw;
}

// A6: Detect correction signals in transcript — returns hint to inject into NLP context
function getCorrectionHint(transcript: string): string | null {
  const lower = transcript.toLowerCase();
  const CORRECTION_WORDS = ["actually", "no i said", "no i meant", "i said", "not that", "wrong", "change that", "wait"];
  if (CORRECTION_WORDS.some((w) => lower.includes(w))) {
    return "[CONTEXT: Customer may be correcting a previous order item — pay attention to the full context]";
  }
  return null;
}

// S4: Log NLP intent for analysis
function logIntent(transcript: string, action: string, items: string[], confidence: number) {
  const entry = { ts: new Date().toISOString(), transcript, action, items, confidence };
  console.log("[NLP_INTENT]", JSON.stringify(entry));
}

export async function POST(request: NextRequest) {
  try {
    const { transcript: rawTranscript, cartSummary, conversationHistory, lastAdded } = await request.json();

    if (!rawTranscript || typeof rawTranscript !== "string") {
      return NextResponse.json(
        { error: "transcript is required" },
        { status: 400 }
      );
    }

    // A7: Normalise transcript before sending to NLP
    const transcript = normaliseTranscript(rawTranscript);

    // A6: Detect correction signals
    const correctionHint = getCorrectionHint(transcript);

    // Fetch menu from in-memory cache (< 1ms hit, ~50ms miss)
    const menu = await getCachedMenu();

    // Get meal-eligible item names for prompt context
    const mealEligibleItems = await getMealEligibleItems(menu);

    // Build cart context with optional correction hint (A6)
    const cartContext = correctionHint
      ? `${cartSummary ?? ""}\n${correctionHint}`
      : (cartSummary ?? "");

    // GPT-4o-mini RAG parse with conversation history + streaming
    const intent = await processOrderSpeech(
      transcript,
      menu,
      cartContext,
      conversationHistory ?? [],
      lastAdded ?? undefined,
      mealEligibleItems
    );

    // Undo and info actions have no items to resolve
    if (intent.action === "undo" || intent.action === "info") {
      return NextResponse.json(intent);
    }

    // Resolve item names to menu item IDs + real prices via fuzzy matching
    // A3: Use Fuse.js score as the authoritative confidence (overrides GPT's self-reported confidence)
    for (const item of intent.items) {
      if (!item.name) continue;
      const match = fuzzyMatchMenuItem(item.name, menu);
      if (match) {
        item.matchedMenuItemId = match.item.id;
        item.name = match.item.name;
        item.confidence = match.score; // A3: Fuse.js score is ground truth
        // Enrich with real DB price
        item.unitPrice = match.item.price;
        item.categoryName = match.item.categoryName;
      }
    }

    // A4: Medium-confidence verbal confirmation — only when response has no existing question
    // Never stack "is that right?" on top of another question (meal offer, sauce, size, etc.)
    if (intent.action === "add" && intent.items.length > 0) {
      const mediumConfidenceItems = intent.items.filter(
        (i) => i.confidence >= 0.55 && i.confidence < 0.80 && i.matchedMenuItemId
      );
      const responseHasQuestion = intent.response?.includes("?") ?? false;
      if (mediumConfidenceItems.length > 0 && intent.response && !responseHasQuestion) {
        const names = mediumConfidenceItems.map((i) => i.name).join(" and ");
        intent.response = intent.response.replace(/[.!]?\s*$/, "") + ` — ${names}, is that right?`;
      }
    }

    // Fix modify_size: after fuzzy match, ensure we resolve to the correct size variant.
    // Fuse.js may pick the wrong size (e.g. "French Fries Small" instead of "French Fries Large").
    if (intent.action === "modify_size") {
      for (const item of intent.items) {
        const targetSize = (item.newSize ?? "").toLowerCase();
        if (!targetSize) continue;
        // If current matched name already has the right size, no action needed
        if (item.name.toLowerCase().includes(targetSize)) continue;
        // Strip size words from matched name to get the base item keyword
        const baseName = item.name
          .toLowerCase()
          .replace(/\b(small|medium|large)\b/g, "")
          .trim();
        if (!baseName) continue;
        const baseWords = baseName.split(/\s+/).filter((w) => w.length > 2);
        // Find menu item matching all base words + target size
        const sizeVariant = menu.find((m) => {
          const mLower = m.name.toLowerCase();
          return (
            mLower.includes(targetSize) &&
            baseWords.every((w) => mLower.includes(w))
          );
        });
        if (sizeVariant && sizeVariant.id !== item.matchedMenuItemId) {
          item.matchedMenuItemId = sizeVariant.id;
          item.name = sizeVariant.name;
          item.unitPrice = sizeVariant.price;
          item.categoryName = sizeVariant.categoryName;
        }
      }
    }

    // Variant detection: if NLP picked a specific variant but user used a generic name,
    // check if there are multiple variants and trigger clarification.
    // Only triggers for genuinely ambiguous cases (e.g. "McFlurry" when OREO and M&M's exist).
    // Does NOT trigger when a number or distinguishing word uniquely identifies the variant.
    if (intent.action === "add" && intent.items.length > 0) {
      for (const item of intent.items) {
        if (!item.matchedMenuItemId || !item.name) continue;
        const words = transcript.toLowerCase().split(/\s+/);
        const matchedLower = item.name.toLowerCase();
        const genericBase = matchedLower.split(/\s+/)[0]; // e.g., "mcflurry", "ayam"
        if (!genericBase || !words.some((w) => w.includes(genericBase) || genericBase.includes(w))) continue;

        // Check if user said enough of the full specific name
        const userSaidSpecific = matchedLower.split(/\s+/).every((word) =>
          words.some((w) => w.includes(word) || word.includes(w))
        );
        if (userSaidSpecific) continue;

        // Find all other variants sharing the same generic base
        const variants = menu.filter(
          (m) => m.name.toLowerCase().includes(genericBase) && m.id !== item.matchedMenuItemId
        );
        if (variants.length === 0) continue;

        // Deduplicate by name — some menu items share identical display names across IDs
        const seenNames = new Set<string>();
        const allVariants = [
          menu.find((m) => m.id === item.matchedMenuItemId)!,
          ...variants,
        ].filter(Boolean).filter((v) => {
          if (seenNames.has(v.name)) return false;
          seenNames.add(v.name);
          return true;
        });

        // Skip clarification if a NUMBER in the transcript uniquely identifies the matched item
        // e.g. "9 pieces of ayam goreng" → "9" only matches "Ayam Goreng McD 9pc"
        const numMap: Record<string, string> = {
          one: "1", two: "2", three: "3", four: "4", five: "5",
          six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
        };
        const userNums = words
          .map((w) => numMap[w] ?? (/^\d+$/.test(w) ? w : null))
          .filter((n): n is string => n !== null);
        if (userNums.length > 0) {
          const numMatched = allVariants.filter((v) =>
            userNums.some((n) => v.name.toLowerCase().includes(n))
          );
          if (numMatched.length === 1 && numMatched[0].id === item.matchedMenuItemId) continue;
        }

        // Skip clarification if a DISTINGUISHING WORD (not the generic base) in the user's
        // transcript uniquely identifies the matched item
        // e.g. "happy meal mcnuggets" → "mcnuggets" only matches "Happy Meal McNuggets 4pc"
        const distinguishingWords = matchedLower
          .split(/\s+/)
          .filter(
            (w) => w !== genericBase && w.length > 2 &&
              words.some((uw) => uw.includes(w) || w.includes(uw))
          );
        if (distinguishingWords.length > 0) {
          // Check if ANY single distinguishing word uniquely identifies the matched item
          const uniquelyIdentified = distinguishingWords.some((dw) => {
            const distMatched = allVariants.filter((v) => v.name.toLowerCase().includes(dw));
            return distMatched.length === 1 && distMatched[0].id === item.matchedMenuItemId;
          });
          if (uniquelyIdentified) continue;
        }

        // Genuinely ambiguous — convert to clarification
        intent.fuzzyCandidates = allVariants.map((v) => ({
          id: v.id,
          name: v.name,
          price: v.price,
          score: 1.0,
          categoryName: v.categoryName,
        }));
        const variantList = allVariants.map((v) => `${v.name} (RM ${v.price.toFixed(2)})`).join(" or ");
        intent.action = "unknown" as any;
        intent.items = [];
        intent.response = `We have ${variantList} — which would you like?`;
        intent.clarificationNeeded = `Multiple variants available for "${genericBase}"`;
        break;
      }
    }

    // Server-side meal offer enforcement: strip "make it a meal" from response
    // if NONE of the added items are meal-eligible (GPT sometimes ignores the rule)
    if (intent.action === "add" && intent.response && mealEligibleItems.length > 0) {
      const eligibleSet = new Set(mealEligibleItems.map((n) => n.toLowerCase()));
      const hasEligibleItem = intent.items.some(
        (i) => i.matchedMenuItemId && eligibleSet.has((i.name ?? "").toLowerCase())
      );
      if (!hasEligibleItem && /\bmeal\b/i.test(intent.response)) {
        // Strip the meal offer sentence from the response
        intent.response = intent.response
          .replace(/\s*would you like to make (?:that|it|.+?) a meal[^?]*\??/gi, "")
          .replace(/\s*want to make (?:that|it|.+?) a meal[^?]*\??/gi, "")
          .trim();
        // If response got emptied, provide a simple confirmation
        if (!intent.response) {
          const names = intent.items.map((i) => i.name).filter(Boolean).join(" and ");
          intent.response = `I've added ${names} to your order! Anything else?`;
        }
      }
    }

    // If NLP returned unknown/low-confidence, try fuzzy search as fallback
    if (
      intent.action === "unknown" ||
      (intent.items.length > 0 && intent.items.every((i) => i.confidence < 0.5))
    ) {
      const fuzzyResults = fuzzySearchAll(transcript, menu, 5);
      if (fuzzyResults.length > 0) {
        intent.fuzzyCandidates = fuzzyResults.map((r) => ({
          id: r.item.id,
          name: r.item.name,
          price: r.item.price,
          score: r.score,
          categoryName: r.item.categoryName,
        }));
      }
    }

    // S4: Log intent for analysis
    logIntent(
      transcript,
      intent.action,
      intent.items.map((i) => i.name),
      intent.items.length > 0 ? intent.items[0].confidence : 1.0
    );

    return NextResponse.json(intent);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("NLP parse error:", message, error);

    // Return a graceful fallback so the UI still works
    if (message.includes("401") || message.includes("API key")) {
      return NextResponse.json({
        action: "unknown",
        items: [],
        clarificationNeeded: "Voice ordering is temporarily unavailable.",
        response:
          "Sorry, voice ordering is temporarily unavailable. Please use the menu below to add items.",
        _error: "Invalid OpenAI API key",
      });
    }

    // Database not reachable — menu can't load
    if (message.includes("does not exist") || message.includes("ECONNREFUSED") || message.includes("connect")) {
      return NextResponse.json({
        action: "unknown",
        items: [],
        response:
          "Sorry, I can't access the menu right now. The database may be offline. Please try again in a moment.",
        _error: `Database error: ${message}`,
      });
    }

    return NextResponse.json({
      action: "unknown",
      items: [],
      response:
        "Sorry, I had trouble understanding that. Could you try again?",
      _error: message,
    });
  }
}
