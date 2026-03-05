import OpenAI from "openai";
import { env } from "@/lib/env";
import type { NLPOrderIntent, MenuItemDTO } from "@/lib/types";

const SYSTEM_PROMPT = `You are Casey, a friendly McDonald's AI ordering assistant. Parse customer speech into structured order intents.

RULES:
1. Extract item names, quantities (default 1), and customizations
2. Map spoken names to the closest menu item (e.g. "big mac" -> "Big Mac")
3. If the customer says "remove" or "cancel" an item, use action "remove"
4. If the customer says "change" or "modify" or corrections like "no I meant", "actually", "switch", use action "modify"
5. If the customer says "clear" or "start over", use action "clear"
6. If the customer says "checkout", "that's all", "done", "I'm good", "that's everything", "place the order", use action "checkout"
7. If unclear, set action to "unknown" and provide a clarificationNeeded message
8. Always include a friendly response the avatar will speak aloud
9. For customizations, only include ones that exist in the menu data
10. Quantity must be a positive integer. "a" or "an" means 1, "couple" means 2
11. If the customer mentions a size (small/medium/large), match the sized variant
12. Confidence: 1.0 for exact match, 0.7+ for likely match, below 0.5 needs clarification
13. Keep responses SHORT and conversational (1-2 sentences max)
14. If adding items, respond with enthusiasm. If removing, be understanding.
15. For "modify" actions, include BOTH the original item name (in "originalName" field) and what they want to change it to
16. Yes/no answers about meal upgrades: if cart context shows a pending meal offer, action "meal_response", items[0].name = "yes" or "no"
17. Responses to "would you like fries/drink" or other suggestions: treat as new "add" if they say yes

Respond ONLY with valid JSON matching this schema:
{
  "action": "add" | "remove" | "modify" | "clear" | "checkout" | "meal_response" | "unknown",
  "items": [{ "name": string, "quantity": number, "customizations": string[], "confidence": number, "originalName"?: string }],
  "clarificationNeeded": string | undefined,
  "response": string
}`;

interface ConversationMessage {
  role: "user" | "assistant";
  text: string;
}

export async function processOrderSpeech(
  transcript: string,
  menu: MenuItemDTO[],
  cartContext: string,
  conversationHistory: ConversationMessage[] = []
): Promise<NLPOrderIntent> {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY() });

  // Compressed menu format to save tokens (~60% reduction)
  const menuContext = menu
    .map(
      (item) =>
        `${item.name} $${item.price}${item.aliases.length ? ` [${item.aliases.join(",")}]` : ""}${
          item.customizations.length
            ? ` {${item.customizations.map((c) => `${c.name}${c.priceExtra > 0 ? ` +$${c.priceExtra}` : ""}`).join(",")}}`
            : ""
        }`
    )
    .join(" | ");

  // Build messages array with conversation history for context
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.text,
    });
  }

  messages.push({
    role: "user",
    content: `MENU: ${menuContext}\n\nCART: ${cartContext || "Empty"}\n\nCUSTOMER: "${transcript}"`,
  });

  // Streaming for faster first-token, buffer complete result for JSON parse
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    max_tokens: 500,
    messages,
    response_format: { type: "json_object" },
    stream: true,
  });

  let buffer = "";
  for await (const chunk of stream) {
    buffer += chunk.choices[0]?.delta?.content || "";
  }

  if (!buffer) {
    return {
      action: "unknown",
      items: [],
      clarificationNeeded: "I didn't catch that. Could you say that again?",
      response: "Sorry, I didn't catch that. Could you repeat your order?",
    };
  }

  return JSON.parse(buffer) as NLPOrderIntent;
}
