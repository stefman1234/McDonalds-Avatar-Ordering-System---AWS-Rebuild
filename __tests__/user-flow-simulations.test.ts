/**
 * User Flow Simulation Tests
 * Simulates 20 realistic customer conversations via the NLP parse-order API.
 * Each test sends sequential messages and validates the responses are correct.
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

interface NLPResponse {
  action: string;
  items: Array<{
    name: string;
    quantity: number;
    customizations: string[];
    confidence: number;
    matchedMenuItemId?: number;
    unitPrice?: number;
    categoryName?: string;
    originalName?: string;
  }>;
  response: string;
  clarificationNeeded?: string;
  fuzzyCandidates?: Array<{
    id: number;
    name: string;
    price: number;
    score: number;
    categoryName: string;
  }>;
  _error?: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  text: string;
}

async function sendMessage(
  transcript: string,
  cartSummary: string = "Empty",
  conversationHistory: ConversationMessage[] = []
): Promise<NLPResponse> {
  const res = await fetch(`${BASE_URL}/api/nlp/parse-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, cartSummary, conversationHistory }),
  });
  return res.json();
}

// Helper to assert common response properties
function expectValidResponse(response: NLPResponse) {
  expect(response).toHaveProperty("action");
  expect(response).toHaveProperty("items");
  expect(response).toHaveProperty("response");
  expect(typeof response.response).toBe("string");
  expect(response.response.length).toBeGreaterThan(0);
}

describe("User Flow Simulations — 20 Conversations", () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. Simple single item order
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 1: Simple single item — 'Can I get a Big Mac?'",
    async () => {
      const r = await sendMessage("Can I get a Big Mac?");
      expectValidResponse(r);
      expect(r.action).toBe("add");
      expect(r.items.length).toBeGreaterThanOrEqual(1);
      expect(r.items[0].name.toLowerCase()).toContain("big mac");
      expect(r.items[0].matchedMenuItemId).toBeDefined();
      expect(r.items[0].unitPrice).toBeGreaterThan(0);
      console.log(`  ✅ Added: ${r.items[0].name} @ $${r.items[0].unitPrice}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. Multiple items in one request
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 2: Multiple items — 'two Big Macs and a large fries'",
    async () => {
      const r = await sendMessage("two Big Macs and a large fries");
      expectValidResponse(r);
      expect(r.action).toBe("add");
      expect(r.items.length).toBeGreaterThanOrEqual(2);
      const bigMac = r.items.find((i) => i.name.toLowerCase().includes("big mac"));
      expect(bigMac).toBeDefined();
      expect(bigMac!.quantity).toBe(2);
      console.log(`  ✅ Items: ${r.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. Show me chicken options
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 3: Browsing — 'Show me chicken options'",
    async () => {
      const r = await sendMessage("Show me your chicken options");
      expectValidResponse(r);
      // May be "add" with chicken items, or "unknown" with fuzzy candidates
      const hasChickenItems = r.items.some((i) =>
        i.name.toLowerCase().includes("chicken") || i.categoryName?.toLowerCase().includes("chicken")
      );
      const hasFuzzyCandidates = r.fuzzyCandidates?.some((c) =>
        c.name.toLowerCase().includes("chicken") || c.categoryName?.toLowerCase().includes("chicken")
      );
      expect(hasChickenItems || hasFuzzyCandidates || r.response.toLowerCase().includes("chicken")).toBe(true);
      console.log(`  ✅ Action: ${r.action}`);
      if (r.items.length > 0) console.log(`  📋 Items shown: ${r.items.map((i) => i.name).join(", ")}`);
      if (r.fuzzyCandidates?.length) console.log(`  📋 Fuzzy candidates: ${r.fuzzyCandidates.map((c) => c.name).join(", ")}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. Order with customization
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 4: Customization — 'Big Mac with no pickles'",
    async () => {
      const r = await sendMessage("I want a Big Mac with no pickles");
      expectValidResponse(r);
      expect(r.action).toBe("add");
      const bigMac = r.items.find((i) => i.name.toLowerCase().includes("big mac"));
      expect(bigMac).toBeDefined();
      expect(bigMac!.customizations.some((c) => c.toLowerCase().includes("pickle"))).toBe(true);
      console.log(`  ✅ ${bigMac!.name} — Custom: ${bigMac!.customizations.join(", ")}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. Multi-turn: add then add more
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 5: Multi-turn add — 'and a medium coke' after Big Mac",
    async () => {
      const history: ConversationMessage[] = [
        { role: "user", text: "I want a Big Mac" },
        { role: "assistant", text: "Got it! Big Mac added. Anything else?" },
      ];
      const r = await sendMessage("and a medium coke", "1x Big Mac", history);
      expectValidResponse(r);
      expect(r.action).toBe("add");
      expect(r.items.some((i) => i.name.toLowerCase().includes("coke") || i.name.toLowerCase().includes("coca"))).toBe(true);
      console.log(`  ✅ Added: ${r.items.map((i) => i.name).join(", ")}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. Remove item
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 6: Remove — 'remove the fries'",
    async () => {
      const r = await sendMessage("remove the fries", "1x Big Mac, 1x Medium Fries");
      expectValidResponse(r);
      expect(r.action).toBe("remove");
      expect(r.items.some((i) => i.name.toLowerCase().includes("fries"))).toBe(true);
      console.log(`  ✅ Removing: ${r.items.map((i) => i.name).join(", ")}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. Modify/Change item
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 7: Modify — 'actually change the Big Mac to a Quarter Pounder'",
    async () => {
      const r = await sendMessage(
        "actually change the Big Mac to a Quarter Pounder",
        "1x Big Mac, 1x Medium Fries"
      );
      expectValidResponse(r);
      expect(["modify", "add", "remove"]).toContain(r.action);
      const hasQP = r.items.some((i) => i.name.toLowerCase().includes("quarter"));
      expect(hasQP).toBe(true);
      console.log(`  ✅ Action: ${r.action}`);
      console.log(`  📋 Items: ${r.items.map((i) => `${i.name}${i.originalName ? ` (was: ${i.originalName})` : ""}`).join(", ")}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. Clear cart
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 8: Clear — 'start over'",
    async () => {
      const r = await sendMessage("start over", "1x Big Mac, 2x Fries");
      expectValidResponse(r);
      expect(r.action).toBe("clear");
      console.log(`  ✅ Action: clear`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9. Checkout flow
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 9: Checkout — 'that's all, place my order'",
    async () => {
      const r = await sendMessage("that's all, place my order", "1x Big Mac ($8.99), 1x Medium Fries ($4.49)");
      expectValidResponse(r);
      expect(["checkout", "unknown"]).toContain(r.action);
      console.log(`  ✅ Action: ${r.action}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 10. McNuggets order
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 10: McNuggets — '10 piece nuggets'",
    async () => {
      const r = await sendMessage("10 piece nuggets");
      expectValidResponse(r);
      expect(r.action).toBe("add");
      expect(r.items.some((i) => i.name.toLowerCase().includes("nugget") || i.name.toLowerCase().includes("mcnugget"))).toBe(true);
      console.log(`  ✅ Added: ${r.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 11. Meal response — "yes" to upgrade
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 11: Meal upgrade — 'yes' after meal offer",
    async () => {
      const history: ConversationMessage[] = [
        { role: "user", text: "I want a Big Mac" },
        { role: "assistant", text: "Would you like to make that a Big Mac Meal? It comes with fries and a drink." },
      ];
      const r = await sendMessage("yes please", "1x Big Mac [PENDING_MEAL_OFFER: Big Mac Meal]", history);
      expectValidResponse(r);
      // Should be meal_response or add
      expect(["meal_response", "add"]).toContain(r.action);
      console.log(`  ✅ Action: ${r.action}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 12. Meal response — "no" to upgrade
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 12: Decline meal — 'no thanks, just the sandwich'",
    async () => {
      const history: ConversationMessage[] = [
        { role: "user", text: "McChicken please" },
        { role: "assistant", text: "Would you like to make that a McChicken Meal?" },
      ];
      const r = await sendMessage("no thanks, just the sandwich", "1x McChicken [PENDING_MEAL_OFFER: McChicken Meal]", history);
      expectValidResponse(r);
      expect(["meal_response", "add"]).toContain(r.action);
      console.log(`  ✅ Action: ${r.action}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 13. Responding to upsell suggestion
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 13: Upsell response — 'yes add fries' after suggestion",
    async () => {
      const history: ConversationMessage[] = [
        { role: "user", text: "I want a Big Mac" },
        { role: "assistant", text: "Got it! Would you like fries with that?" },
      ];
      const r = await sendMessage("yes, medium fries", "1x Big Mac", history);
      expectValidResponse(r);
      expect(r.action).toBe("add");
      expect(r.items.some((i) => i.name.toLowerCase().includes("fries"))).toBe(true);
      console.log(`  ✅ Added: ${r.items.map((i) => i.name).join(", ")}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 14. Declining upsell
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 14: Decline upsell — 'no thanks'",
    async () => {
      const history: ConversationMessage[] = [
        { role: "user", text: "Quarter Pounder" },
        { role: "assistant", text: "Can I get you a drink to go with your meal?" },
      ];
      const r = await sendMessage("no thanks", "1x Quarter Pounder with Cheese", history);
      expectValidResponse(r);
      // Should not add anything
      expect(r.items.length === 0 || r.action === "unknown" || r.action === "meal_response").toBe(true);
      console.log(`  ✅ Action: ${r.action} (no items added)`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 15. Large order — family scenario
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 15: Large family order — multiple different items",
    async () => {
      const r = await sendMessage(
        "I need two Big Macs, a McChicken, three medium fries, and two cokes"
      );
      expectValidResponse(r);
      expect(r.action).toBe("add");
      expect(r.items.length).toBeGreaterThanOrEqual(3);
      const totalQty = r.items.reduce((sum, i) => sum + i.quantity, 0);
      expect(totalQty).toBeGreaterThanOrEqual(5);
      console.log(`  ✅ Total items qty: ${totalQty}`);
      console.log(`  📋 ${r.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 16. Slang/casual speech
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 16: Casual speech — 'lemme get a quarter pounder'",
    async () => {
      const r = await sendMessage("lemme get a quarter pounder");
      expectValidResponse(r);
      expect(r.action).toBe("add");
      expect(r.items.some((i) => i.name.toLowerCase().includes("quarter"))).toBe(true);
      console.log(`  ✅ Understood slang → ${r.items[0].name}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 17. Ambiguous item — "a burger"
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 17: Ambiguous — 'I want a burger'",
    async () => {
      const r = await sendMessage("I want a burger");
      expectValidResponse(r);
      // Could be "add" with a best guess, or "unknown" with candidates
      const hasBurger = r.items.some((i) => i.categoryName?.includes("Burger"));
      const hasCandidates = (r.fuzzyCandidates?.length ?? 0) > 0;
      const mentionsBurger = r.response.toLowerCase().includes("burger") || r.response.toLowerCase().includes("mac");
      expect(hasBurger || hasCandidates || mentionsBurger).toBe(true);
      console.log(`  ✅ Action: ${r.action}`);
      if (r.items.length > 0) console.log(`  📋 Best guess: ${r.items[0].name} (confidence: ${r.items[0].confidence})`);
      if (r.fuzzyCandidates?.length) console.log(`  📋 Candidates: ${r.fuzzyCandidates.map((c) => c.name).join(", ")}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 18. Breakfast item
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 18: Breakfast — 'Egg McMuffin and a coffee'",
    async () => {
      const r = await sendMessage("Egg McMuffin and a coffee");
      expectValidResponse(r);
      expect(r.action).toBe("add");
      expect(r.items.length).toBeGreaterThanOrEqual(1);
      console.log(`  ✅ Added: ${r.items.map((i) => `${i.quantity}x ${i.name} ($${i.unitPrice ?? "?"})`).join(", ")}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 19. Dessert add-on mid-conversation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 19: Dessert add-on — 'and a McFlurry' mid-order",
    async () => {
      const history: ConversationMessage[] = [
        { role: "user", text: "Big Mac and fries" },
        { role: "assistant", text: "Got it! Big Mac and Medium Fries added. Anything else?" },
        { role: "user", text: "Can I get a drink too?" },
        { role: "assistant", text: "Sure! What drink would you like?" },
      ];
      const r = await sendMessage("medium coke and a McFlurry", "1x Big Mac, 1x Medium Fries", history);
      expectValidResponse(r);
      expect(r.action).toBe("add");
      expect(r.items.length).toBeGreaterThanOrEqual(1);
      console.log(`  ✅ Added: ${r.items.map((i) => i.name).join(", ")}`);
      console.log(`  🤖 Casey: "${r.response}"`);
    },
    30000
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 20. Full flow: order → modify → checkout
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  it(
    "Conversation 20: Full flow — order, modify, then checkout",
    async () => {
      // Step 1: Initial order
      const r1 = await sendMessage("I want a Big Mac and medium fries");
      expectValidResponse(r1);
      expect(r1.action).toBe("add");
      console.log(`  Step 1 ✅ Added: ${r1.items.map((i) => i.name).join(", ")}`);

      // Step 2: Modify
      const history2: ConversationMessage[] = [
        { role: "user", text: "I want a Big Mac and medium fries" },
        { role: "assistant", text: r1.response },
      ];
      const r2 = await sendMessage(
        "actually make that a Quarter Pounder instead of the Big Mac",
        "1x Big Mac, 1x Medium Fries",
        history2
      );
      expectValidResponse(r2);
      expect(["modify", "add", "remove"]).toContain(r2.action);
      console.log(`  Step 2 ✅ Modified: ${r2.action} — ${r2.items.map((i) => i.name).join(", ")}`);

      // Step 3: Checkout
      const history3: ConversationMessage[] = [
        ...history2,
        { role: "user", text: "actually make that a Quarter Pounder" },
        { role: "assistant", text: r2.response },
      ];
      const r3 = await sendMessage(
        "that's everything, I'm done",
        "1x Quarter Pounder with Cheese, 1x Medium Fries",
        history3
      );
      expectValidResponse(r3);
      expect(["checkout", "unknown"]).toContain(r3.action);
      console.log(`  Step 3 ✅ Checkout: ${r3.action}`);
      console.log(`  🤖 Casey: "${r3.response}"`);
    },
    60000
  );
});
