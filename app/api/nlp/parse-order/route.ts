import { NextRequest, NextResponse } from "next/server";
import { getCachedMenu } from "@/lib/cache/menuCache";
import { processOrderSpeech } from "@/lib/nlp/orderProcessor";
import { fuzzyMatchMenuItem } from "@/lib/utils/fuzzyMatcher";

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

    // Resolve item names to menu item IDs via fuzzy matching
    for (const item of intent.items) {
      const match = fuzzyMatchMenuItem(item.name, menu);
      if (match) {
        item.matchedMenuItemId = match.item.id;
        item.name = match.item.name;
        item.confidence = Math.max(item.confidence, match.score);
      }
    }

    return NextResponse.json(intent);
  } catch (error) {
    console.error("NLP parse error:", error);
    return NextResponse.json(
      { error: "Failed to process order" },
      { status: 500 }
    );
  }
}
