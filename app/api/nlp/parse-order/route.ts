import { NextRequest, NextResponse } from "next/server";
import { getCachedMenu } from "@/lib/cache/menuCache";
import { processOrderSpeech } from "@/lib/nlp/orderProcessor";
import { fuzzyMatchMenuItem, fuzzySearchAll } from "@/lib/utils/fuzzyMatcher";

export async function POST(request: NextRequest) {
  try {
    const { transcript, cartSummary, conversationHistory } = await request.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "transcript is required" },
        { status: 400 }
      );
    }

    // Fetch menu from in-memory cache (< 1ms hit, ~50ms miss)
    const menu = await getCachedMenu();

    // GPT-4o-mini RAG parse with conversation history + streaming
    const intent = await processOrderSpeech(
      transcript,
      menu,
      cartSummary ?? "",
      conversationHistory ?? []
    );

    // Resolve item names to menu item IDs + real prices via fuzzy matching
    for (const item of intent.items) {
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

    return NextResponse.json({
      action: "unknown",
      items: [],
      response:
        "Sorry, I had trouble understanding that. Could you try again?",
      _error: message,
    });
  }
}
