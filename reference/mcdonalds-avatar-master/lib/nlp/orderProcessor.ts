import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ParsedOrderItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  size?: 'small' | 'medium' | 'large';
  customizations?: string[];
  confidence: number;
}

export interface OrderParseResult {
  items: ParsedOrderItem[];
  intent: 'order' | 'modify' | 'remove' | 'checkout' | 'unclear';
  clarificationNeeded?: string;
  response: string;
  // Item not found fields (populated by fuzzy matcher)
  itemNotFound?: boolean;
  filteredItems?: any[];
  filterQuery?: string;
  filterMessage?: string;
}

/**
 * Process user speech and extract order intent
 * Uses Google Gemini for NLP
 */
export async function processOrderSpeech(
  userText: string,
  menuItems: any[],
  conversationHistory: any[] = []
): Promise<OrderParseResult> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = buildOrderParsingPrompt(userText, menuItems, conversationHistory);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    const parsed = JSON.parse(responseText);

    return {
      items: parsed.items || [],
      intent: parsed.intent || 'unclear',
      clarificationNeeded: parsed.clarificationNeeded,
      response: parsed.response,
    };
  } catch (error) {
    console.error('[NLP] Order processing error:', error);

    // Fallback response on error
    return {
      items: [],
      intent: 'unclear',
      clarificationNeeded: 'Sorry, I didn\'t catch that. Could you repeat your order?',
      response: 'I\'m having trouble understanding. Could you please repeat that?',
    };
  }
}

/**
 * Build the prompt for Gemini to parse order
 */
function buildOrderParsingPrompt(userText: string, menuItems: any[], conversationHistory: any[] = []): string {
  const menuList = menuItems
    .map((item) => `- ${item.name} (ID: ${item.id}, Price: $${item.base_price})`)
    .join('\n');

  // Build conversation context string
  const contextStr = conversationHistory.length > 0
    ? `\n\nCONVERSATION HISTORY (recent messages):\n${conversationHistory.map(m =>
        `${m.sender === 'user' ? 'Customer' : 'Casey'}: ${m.text}`
      ).join('\n')}\n`
    : '';

  return `You are Casey, a friendly AI assistant for a McDonald's ordering kiosk in Malaysia. Parse the customer's speech and extract their order.

AVAILABLE MENU ITEMS:
${menuList}
${contextStr}
CUSTOMER JUST SAID: "${userText}"

TASK: Extract order items, quantities, and intent. Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "intent": "order" | "modify" | "remove" | "checkout" | "unclear",
  "items": [
    {
      "menuItemId": "uuid-from-menu",
      "name": "Item Name",
      "basePrice": 0.00,
      "quantity": 1,
      "size": "medium",
      "confidence": 0.0-1.0
    }
  ],
  "clarificationNeeded": "string if unclear",
  "response": "Natural response to customer"
}

RULES:
1. **Use conversation history**: Reference previous messages for context (e.g., "same size as before", "another one", "make it large")
2. Match user's words to menu items (handle variations: "big mac", "bigmac", "Big Macs")
3. Understand Malaysian/Malay terms: "ayam" (chicken), "ikan" (fish), "kentang" (potato), "air" (water), "ais krim" (ice cream)
4. Handle misspellings: "borgir" → burger, "chiken" → chicken, "frice" → fries
5. Extract quantities (default 1 if not specified): "6 piece", "4pc", "two", "double"
6. Set confidence: 1.0 if exact match, 0.7-0.9 if fuzzy match, <0.5 if very unsure
7. For items not on menu OR low confidence: set intent="unclear", return empty items array
8. Generate friendly, concise response (1-2 sentences) acknowledging conversation context when relevant
9. Return ONLY the JSON object, no other text

EXAMPLES:
Input: "I want a Big Mac and large fries"
Output: {"intent":"order","items":[{"menuItemId":"<id>","name":"Big Mac","basePrice":5.99,"quantity":1,"confidence":1.0},{"menuItemId":"<id>","name":"French Fries Large","basePrice":2.99,"quantity":1,"size":"large","confidence":1.0}],"response":"Got it! I'll add a Big Mac and large fries to your order. Anything else?"}

Input: "Can I get two cheeseburgers"
Output: {"intent":"order","items":[{"menuItemId":"<id>","name":"Cheeseburger","basePrice":1.99,"quantity":2,"confidence":1.0}],"response":"Sure! Adding two cheeseburgers. Would you like anything else?"}

Input: "I want nuggets"
Output: {"intent":"unclear","items":[],"clarificationNeeded":"What size nuggets would you like?","response":"Great choice! Would you like the 4-piece, 6-piece, 9-piece, or 20-piece Chicken McNuggets?"}

Input: "spicy burger"
Output: {"intent":"unclear","items":[],"response":"Let me show you our spicy burger options!"}

CONVERSATION CONTEXT EXAMPLES:
History: Customer: "I want a large Coke" | Casey: "Got it! Adding a large Coke..."
Input: "same size fries please"
Output: {"intent":"order","items":[{"menuItemId":"<id>","name":"French Fries Large","basePrice":2.99,"quantity":1,"size":"large","confidence":1.0}],"response":"Perfect! Adding large fries to match your drink size."}

History: Customer: "Can I get a Big Mac" | Casey: "Sure! Adding a Big Mac..."
Input: "make it a large"
Output: {"intent":"modify","items":[],"response":"Got it, I'll make that a large Big Mac!"}

Now process the customer's speech above.`;
}
