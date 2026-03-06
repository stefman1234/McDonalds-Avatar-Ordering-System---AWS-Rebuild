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

export async function POST(request: NextRequest) {
  try {
    const { transcript, cartSummary, conversationHistory, lastAdded } = await request.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "transcript is required" },
        { status: 400 }
      );
    }

    // Fetch menu from in-memory cache (< 1ms hit, ~50ms miss)
    const menu = await getCachedMenu();

    // Get meal-eligible item names for prompt context
    const mealEligibleItems = await getMealEligibleItems(menu);

    // GPT-4o-mini RAG parse with conversation history + streaming
    const intent = await processOrderSpeech(
      transcript,
      menu,
      cartSummary ?? "",
      conversationHistory ?? [],
      lastAdded ?? undefined,
      mealEligibleItems
    );

    // Undo and info actions have no items to resolve
    if (intent.action === "undo" || intent.action === "info") {
      return NextResponse.json(intent);
    }

    // Resolve item names to menu item IDs + real prices via fuzzy matching
    for (const item of intent.items) {
      if (!item.name) continue;
      const match = fuzzyMatchMenuItem(item.name, menu);
      if (match) {
        item.matchedMenuItemId = match.item.id;
        item.name = match.item.name;
        item.confidence = Math.max(item.confidence, match.score);
        // Enrich with real DB price
        item.unitPrice = match.item.price;
        item.categoryName = match.item.categoryName;
      }
    }

    // Variant detection: if NLP picked a specific variant but user used a generic name,
    // check if there are multiple variants and trigger clarification
    if (intent.action === "add" && intent.items.length > 0) {
      for (const item of intent.items) {
        if (!item.matchedMenuItemId || !item.name) continue;
        // Extract the generic base name from the original transcript
        const words = transcript.toLowerCase().split(/\s+/);
        const matchedLower = item.name.toLowerCase();
        // Find menu items that share a common base with the matched item
        // e.g., "McFlurry with OREO" and "McFlurry with M&M'S" both contain "mcflurry"
        const baseWords = matchedLower.split(/\s+/);
        const genericBase = baseWords[0]; // e.g., "mcflurry"
        if (genericBase && words.some((w) => w.includes(genericBase) || genericBase.includes(w))) {
          // Check if user said the full specific name or just the generic base
          const userSaidSpecific = matchedLower.split(/\s+/).every((word) =>
            words.some((w) => w.includes(word) || word.includes(w))
          );
          if (!userSaidSpecific) {
            // User said generic name — find all variants
            const variants = menu.filter((m) =>
              m.name.toLowerCase().includes(genericBase) && m.id !== item.matchedMenuItemId
            );
            if (variants.length > 0) {
              // Multiple variants exist — convert to clarification
              const allVariants = [
                menu.find((m) => m.id === item.matchedMenuItemId)!,
                ...variants,
              ].filter(Boolean);
              intent.fuzzyCandidates = allVariants.map((v) => ({
                id: v.id,
                name: v.name,
                price: v.price,
                score: 1.0,
                categoryName: v.categoryName,
              }));
              // Override the response to ask which variant
              const variantList = allVariants.map((v) => `${v.name} ($${v.price.toFixed(2)})`).join(" or ");
              intent.action = "unknown" as any;
              intent.items = [];
              intent.response = `We have ${variantList} — which would you like?`;
              intent.clarificationNeeded = `Multiple variants available for "${genericBase}"`;
              break; // Only handle the first ambiguous item
            }
          }
        }
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
