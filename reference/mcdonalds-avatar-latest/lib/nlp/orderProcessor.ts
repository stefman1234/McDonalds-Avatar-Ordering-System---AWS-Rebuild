import OpenAI from 'openai';

export interface ParsedOrderItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  size?: 'small' | 'medium' | 'large';
  customizations?: string[];
  confidence: number;
  isMeal?: boolean; // NEW: Indicates if this is a meal order
  mealDetails?: {
    size?: 'medium' | 'large';
    side?: string; // Side name (will be matched to actual menu item)
    drink?: string; // Drink name (will be matched to actual menu item)
    iceLevel?: 'none' | 'less' | 'full';
  };
}

export interface OrderParseResult {
  items: ParsedOrderItem[];
  intent: 'order' | 'modify' | 'remove' | 'checkout' | 'unclear' | 'meal_response'; // NEW: meal_response intent
  clarificationNeeded?: string;
  response: string;
  // Item not found fields (populated by fuzzy matcher)
  itemNotFound?: boolean;
  filteredItems?: any[];
  filterQuery?: string;
  filterMessage?: string;
  // NEW: Meal response fields (for answering meal customization questions)
  mealResponse?: {
    size?: 'medium' | 'large';
    side?: string;
    drink?: string;
    iceLevel?: 'none' | 'less' | 'full';
  };
}

/**
 * Process user speech and extract order intent
 * Uses OpenAI GPT-4o-mini for NLP
 */
export async function processOrderSpeech(
  userText: string,
  menuItems: any[],
  conversationHistory: any[] = []
): Promise<OrderParseResult> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openai = new OpenAI({ apiKey });

    const prompt = buildOrderParsingPrompt(userText, menuItems, conversationHistory);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that parses McDonald\'s orders and returns valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content || '{}';

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
  "intent": "order" | "modify" | "remove" | "checkout" | "unclear" | "meal_response",
  "items": [
    {
      "menuItemId": "uuid-from-menu",
      "name": "Item Name",
      "basePrice": 0.00,
      "quantity": 1,
      "size": "medium",
      "confidence": 0.0-1.0,
      "isMeal": true,
      "mealDetails": {
        "size": "medium" | "large",
        "side": "fries" | "corn" | "salad",
        "drink": "coke" | "sprite" | "fanta" | "milo" | "orange juice" | "water",
        "iceLevel": "none" | "less" | "full"
      }
    }
  ],
  "clarificationNeeded": "string if unclear",
  "response": "Natural response to customer",
  "mealResponse": {
    "size": "medium" | "large",
    "side": "fries" | "corn" | "salad",
    "drink": "coke" | "sprite" | "fanta" | "milo" | "orange juice" | "water",
    "iceLevel": "none" | "less" | "full"
  }
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
10. **MEAL DETECTION**: Detect meal intent from keywords: "meal", "combo", "with fries and drink", "with a side and drink", "make it a meal"
11. **MEAL RESPONSE INTENT**: If conversation history shows Casey asked a meal customization question (size/side/drink/ice), set intent="meal_response" and extract the answer in mealResponse field
12. **MEAL DETAILS**: For meal orders, extract isMeal=true and populate mealDetails with size, side, drink, iceLevel (if mentioned)
13. **INCOMPLETE MEALS**: If meal keyword detected but details missing, set isMeal=true and leave missing fields undefined
14. **REMOVE INTENT**: Detect remove keywords: "remove", "delete", "take out", "cancel", "get rid of". ALWAYS set intent="remove" for these, NEVER "unclear". Extract the item name even if followed by "meal" or other words.

EXAMPLES:

REGULAR ORDER EXAMPLES:
Input: "I want a Big Mac and large fries"
Output: {"intent":"order","items":[{"menuItemId":"<id>","name":"Big Mac","basePrice":5.99,"quantity":1,"confidence":1.0},{"menuItemId":"<id>","name":"French Fries Large","basePrice":2.99,"quantity":1,"size":"large","confidence":1.0}],"response":"Got it! I'll add a Big Mac and large fries to your order. Anything else?"}

Input: "Can I get two cheeseburgers"
Output: {"intent":"order","items":[{"menuItemId":"<id>","name":"Cheeseburger","basePrice":1.99,"quantity":2,"confidence":1.0}],"response":"Sure! Adding two cheeseburgers. Would you like anything else?"}

MEAL ORDER EXAMPLES:
Input: "I want a Big Mac meal"
Output: {"intent":"order","items":[{"menuItemId":"<id>","name":"Big Mac","basePrice":5.99,"quantity":1,"isMeal":true,"mealDetails":{},"confidence":1.0}],"response":"Great choice! For your Big Mac meal, would you like it medium or large?"}

Input: "I want a large Big Mac meal with fries and Coke"
Output: {"intent":"order","items":[{"menuItemId":"<id>","name":"Big Mac","basePrice":5.99,"quantity":1,"isMeal":true,"mealDetails":{"size":"large","side":"fries","drink":"coke"},"confidence":1.0}],"response":"Perfect! Would you like ice with your Coke? Full ice, less ice, or no ice?"}

Input: "Give me a Big Mac combo with fries"
Output: {"intent":"order","items":[{"menuItemId":"<id>","name":"Big Mac","basePrice":5.99,"quantity":1,"isMeal":true,"mealDetails":{"side":"fries"},"confidence":1.0}],"response":"Great! What size meal would you like - medium or large?"}

MEAL RESPONSE EXAMPLES (answering meal customization questions):
History: Casey: "Would you like your Big Mac meal medium or large?"
Input: "Large"
Output: {"intent":"meal_response","items":[],"mealResponse":{"size":"large"},"response":"Perfect! What side would you like? We have fries, corn cup, or garden salad."}

History: Casey: "What side would you like? We have fries, corn cup, or garden salad."
Input: "Fries please"
Output: {"intent":"meal_response","items":[],"mealResponse":{"side":"fries"},"response":"Great! And what drink would you like? We have Coke, Sprite, Fanta, Milo, and more."}

History: Casey: "And what drink would you like?"
Input: "Coke"
Output: {"intent":"meal_response","items":[],"mealResponse":{"drink":"coke"},"response":"Would you like ice with your Coke? Full ice, less ice, or no ice?"}

History: Casey: "Would you like ice with your Coke? Full ice, less ice, or no ice?"
Input: "Full ice"
Output: {"intent":"meal_response","items":[],"mealResponse":{"iceLevel":"full"},"response":"Perfect! Your meal is complete."}

REMOVE EXAMPLES:
Input: "Remove the Big Mac"
Output: {"intent":"remove","items":[{"menuItemId":"<id>","name":"Big Mac","basePrice":5.99,"quantity":1,"confidence":1.0}],"response":"Sure, I'll remove the Big Mac from your order."}

Input: "Delete cheeseburger"
Output: {"intent":"remove","items":[{"menuItemId":"<id>","name":"Cheeseburger","basePrice":1.99,"quantity":1,"confidence":1.0}],"response":"Got it, removing the cheeseburger."}

Input: "Take out the fries"
Output: {"intent":"remove","items":[{"menuItemId":"<id>","name":"French Fries","basePrice":2.99,"quantity":1,"confidence":1.0}],"response":"No problem, I've removed the fries."}

Input: "Remove the cheeseburger meal"
Output: {"intent":"remove","items":[{"menuItemId":"<id>","name":"Cheeseburger","basePrice":1.99,"quantity":1,"confidence":1.0}],"response":"I'll remove the cheeseburger meal from your order."}

UNCLEAR EXAMPLES:
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
