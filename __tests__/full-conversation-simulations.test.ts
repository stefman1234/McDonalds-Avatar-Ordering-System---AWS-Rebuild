/**
 * Full Conversation Simulations — Exhaustive Multi-Step Tests
 *
 * Tests realistic end-to-end customer journeys through the NLP API,
 * maintaining conversation history and cart state across turns.
 * Covers: upgrades, upsizing, meal offers, corrections, edge cases,
 * polite/rude customers, kids orders, dietary requests, and more.
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
  fuzzyCandidates?: Array<{ id: number; name: string; price: number; score: number; categoryName: string }>;
  _error?: string;
}

interface ConversationMessage { role: "user" | "assistant"; text: string; }

// Conversation state tracker
class ConversationSession {
  history: ConversationMessage[] = [];
  cartItems: Array<{ name: string; qty: number; price: number }> = [];
  turnCount = 0;
  log: string[] = [];

  get cartSummary(): string {
    if (this.cartItems.length === 0) return "Empty";
    return this.cartItems.map(i => `${i.qty}x ${i.name} ($${i.price.toFixed(2)})`).join(", ");
  }

  async send(transcript: string, extraContext: string = ""): Promise<NLPResponse> {
    this.turnCount++;
    const cartCtx = this.cartSummary + (extraContext ? ` ${extraContext}` : "");
    const res = await fetch(`${BASE_URL}/api/nlp/parse-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        cartSummary: cartCtx,
        conversationHistory: this.history.slice(-6),
      }),
    });
    const data: NLPResponse = await res.json();

    // Update history
    this.history.push({ role: "user", text: transcript });
    this.history.push({ role: "assistant", text: data.response });

    // Track cart changes based on action
    if (data.action === "add") {
      for (const item of data.items) {
        const existing = this.cartItems.find(ci => ci.name === item.name);
        if (existing) {
          existing.qty += item.quantity;
        } else {
          this.cartItems.push({ name: item.name, qty: item.quantity, price: item.unitPrice ?? 0 });
        }
      }
    } else if (data.action === "remove") {
      for (const item of data.items) {
        this.cartItems = this.cartItems.filter(ci => !ci.name.toLowerCase().includes(item.name.toLowerCase()));
      }
    } else if (data.action === "clear") {
      this.cartItems = [];
    } else if (data.action === "modify") {
      for (const item of data.items) {
        if (item.originalName) {
          this.cartItems = this.cartItems.filter(ci => !ci.name.toLowerCase().includes(item.originalName!.toLowerCase()));
        }
        this.cartItems.push({ name: item.name, qty: item.quantity, price: item.unitPrice ?? 0 });
      }
    }

    // Log
    this.log.push(`  Turn ${this.turnCount}: USER: "${transcript}"`);
    this.log.push(`    -> action=${data.action} items=[${data.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}]`);
    this.log.push(`    -> CASEY: "${data.response}"`);
    this.log.push(`    -> Cart: ${this.cartSummary}`);

    return data;
  }

  printLog() {
    console.log(this.log.join("\n"));
  }
}

function expectValid(r: NLPResponse) {
  expect(r).toHaveProperty("action");
  expect(r).toHaveProperty("response");
  expect(typeof r.response).toBe("string");
  expect(r.response.length).toBeGreaterThan(0);
  expect(r._error).toBeUndefined();
}

// ═══════════════════════════════════════════════════════
//  MULTI-STEP FULL CONVERSATIONS
// ═══════════════════════════════════════════════════════

describe("Multi-Step Conversations", () => {

  // ─── 1. Classic burger order: order -> upsell response -> checkout ───
  it("Conv 1: Classic burger + fries + drink -> checkout (5 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Hi, can I get a Big Mac please");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items[0].name).toContain("Big Mac");

    const r2 = await s.send("add medium fries too");
    expectValid(r2);
    expect(r2.action).toBe("add");
    expect(r2.items.some(i => i.name.toLowerCase().includes("fries"))).toBe(true);

    const r3 = await s.send("and a medium coke");
    expectValid(r3);
    expect(r3.action).toBe("add");
    expect(r3.items.some(i => i.name.toLowerCase().includes("coke") || i.name.toLowerCase().includes("coca"))).toBe(true);

    expect(s.cartItems.length).toBeGreaterThanOrEqual(3);

    const r4 = await s.send("that's everything");
    expectValid(r4);
    expect(["checkout", "unknown"]).toContain(r4.action);

    const r5 = await s.send("yes, place it please");
    expectValid(r5);

    s.printLog();
    console.log(`  RESULT: ${s.cartItems.length} items in cart, ${s.turnCount} turns`);
  }, 90000);

  // ─── 2. Customer changes mind mid-order ───
  it("Conv 2: Order -> change mind -> swap item -> add more -> checkout (6 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("I'll have a McChicken");
    expectValid(r1);
    expect(r1.action).toBe("add");

    const r2 = await s.send("actually no, change that to a Spicy McChicken");
    expectValid(r2);
    expect(["modify", "add", "remove"]).toContain(r2.action);
    expect(r2.items.some(i => i.name.toLowerCase().includes("spicy"))).toBe(true);

    const r3 = await s.send("and can I get large fries with that");
    expectValid(r3);
    expect(r3.action).toBe("add");

    const r4 = await s.send("wait, make those medium fries instead of large");
    expectValid(r4);
    expect(["modify", "add", "remove"]).toContain(r4.action);

    const r5 = await s.send("add a sprite too");
    expectValid(r5);
    expect(r5.action).toBe("add");

    const r6 = await s.send("ok I'm done");
    expectValid(r6);
    expect(["checkout", "unknown", "meal_response"]).toContain(r6.action);

    s.printLog();
    console.log(`  RESULT: Final cart: ${s.cartSummary}`);
  }, 120000);

  // ─── 3. Meal upgrade flow ───
  it("Conv 3: Order item -> offered meal upgrade -> accept -> add dessert (4 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Quarter Pounder with Cheese please");
    expectValid(r1);
    expect(r1.action).toBe("add");

    // Simulate Casey offering meal upgrade
    s.history.push({ role: "assistant", text: "Would you like to make that a Quarter Pounder Meal? It comes with fries and a drink for just $11.99." });

    const r2 = await s.send("yes make it a meal", "[PENDING_MEAL_OFFER: Quarter Pounder Meal]");
    expectValid(r2);
    expect(["meal_response", "add"]).toContain(r2.action);

    const r3 = await s.send("can I also get a McFlurry with Oreo");
    expectValid(r3);
    expect(r3.action).toBe("add");
    expect(r3.items.some(i => i.name.toLowerCase().includes("mcflurry") || i.name.toLowerCase().includes("oreo"))).toBe(true);

    const r4 = await s.send("that'll be all thanks");
    expectValid(r4);

    s.printLog();
    console.log(`  RESULT: Meal upgraded + dessert added`);
  }, 90000);

  // ─── 4. Meal upgrade declined ───
  it("Conv 4: Order item -> decline meal upgrade -> add side separately (4 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Big Mac please");
    expectValid(r1);
    expect(r1.action).toBe("add");

    s.history.push({ role: "assistant", text: "Would you like to make that a Big Mac Meal with fries and a drink?" });

    const r2 = await s.send("no just the burger", "[PENDING_MEAL_OFFER: Big Mac Meal]");
    expectValid(r2);
    expect(["meal_response", "unknown", "modify"]).toContain(r2.action);

    const r3 = await s.send("actually give me a small fries on the side");
    expectValid(r3);
    // "actually" can trigger modify or add — both valid
    expect(["add", "modify"]).toContain(r3.action);
    expect(r3.items.some(i => i.name.toLowerCase().includes("fries"))).toBe(true);

    const r4 = await s.send("I'm good, that's it");
    expectValid(r4);

    s.printLog();
  }, 90000);

  // ─── 5. Large family order across multiple turns ───
  it("Conv 5: Family order — 4 people ordering one at a time (7 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("ok I need to order for the family. First, two Big Macs");
    expectValid(r1);
    expect(r1.action).toBe("add");
    const bigMac = r1.items.find(i => i.name.toLowerCase().includes("big mac"));
    expect(bigMac?.quantity).toBe(2);

    const r2 = await s.send("my wife wants a McChicken with no mayo");
    expectValid(r2);
    expect(r2.action).toBe("add");

    const r3 = await s.send("and a Filet-O-Fish for grandma");
    expectValid(r3);
    expect(r3.action).toBe("add");

    const r4 = await s.send("the kids want a 4 piece nuggets happy meal");
    expectValid(r4);
    expect(r4.action).toBe("add");

    const r5 = await s.send("we need four medium fries and four medium cokes");
    expectValid(r5);
    expect(r5.action).toBe("add");
    const totalQty = r5.items.reduce((sum, i) => sum + i.quantity, 0);
    expect(totalQty).toBeGreaterThanOrEqual(4);

    const r6 = await s.send("oh and one McFlurry with M&Ms to share");
    expectValid(r6);
    expect(r6.action).toBe("add");

    const r7 = await s.send("that should be everything for us");
    expectValid(r7);

    s.printLog();
    console.log(`  RESULT: Family order — ${s.cartItems.length} line items, ${s.cartItems.reduce((s,i)=>s+i.qty,0)} total qty`);
  }, 120000);

  // ─── 6. Customer removes items then re-adds ───
  it("Conv 6: Add items -> remove some -> re-add different -> checkout (6 turns)", async () => {
    const s = new ConversationSession();

    await s.send("I want a Big Mac, medium fries, and a coke");
    const r2 = await s.send("actually remove the coke");
    expectValid(r2);
    expect(r2.action).toBe("remove");

    const r3 = await s.send("and remove the fries too");
    expectValid(r3);
    expect(r3.action).toBe("remove");

    const r4 = await s.send("give me a sprite instead and large fries");
    expectValid(r4);
    // "instead" may trigger modify or add — both are valid
    expect(["add", "modify"]).toContain(r4.action);
    expect(r4.items.length).toBeGreaterThanOrEqual(1);

    const r5 = await s.send("add a vanilla cone too");
    expectValid(r5);
    expect(r5.action).toBe("add");

    const r6 = await s.send("that's my order");
    expectValid(r6);

    s.printLog();
  }, 120000);

  // ─── 7. Start over mid-order ───
  it("Conv 7: Build order -> clear everything -> start fresh -> checkout (5 turns)", async () => {
    const s = new ConversationSession();

    await s.send("two Quarter Pounders and large fries");

    const r2 = await s.send("you know what, clear everything, start over");
    expectValid(r2);
    expect(r2.action).toBe("clear");
    s.cartItems = []; // Manually clear since we track

    const r3 = await s.send("ok let me just get a 10 piece nuggets");
    expectValid(r3);
    expect(r3.action).toBe("add");
    expect(r3.items.some(i => i.name.toLowerCase().includes("nugget"))).toBe(true);

    const r4 = await s.send("and a small fries");
    expectValid(r4);
    expect(r4.action).toBe("add");

    const r5 = await s.send("that's all");
    expectValid(r5);

    s.printLog();
    console.log(`  RESULT: Cleared and reordered: ${s.cartSummary}`);
  }, 90000);

  // ─── 8. Polite customer with lots of pleasantries ───
  it("Conv 8: Very polite customer — 'please', 'thank you', etc (5 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Hello! Could I please have a Big Mac if that's not too much trouble?");
    expectValid(r1);
    expect(r1.action).toBe("add");

    const r2 = await s.send("Oh that's wonderful, thank you! And may I also have some medium fries please?");
    expectValid(r2);
    expect(r2.action).toBe("add");

    const r3 = await s.send("You're so helpful! I'd love a medium Coca-Cola as well if possible");
    expectValid(r3);
    expect(r3.action).toBe("add");

    const r4 = await s.send("That will be all, thank you so much for your help!");
    expectValid(r4);
    expect(["checkout", "unknown"]).toContain(r4.action);

    // Response should be friendly
    expect(r4.response.length).toBeGreaterThan(5);

    s.printLog();
  }, 90000);

  // ─── 9. Rapid-fire terse customer ───
  it("Conv 9: Terse customer — minimal words (5 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Big Mac");
    expectValid(r1);
    expect(r1.action).toBe("add");

    const r2 = await s.send("fries");
    expectValid(r2);
    expect(r2.action).toBe("add");

    const r3 = await s.send("coke");
    expectValid(r3);
    expect(r3.action).toBe("add");

    const r4 = await s.send("nuggets 10 piece");
    expectValid(r4);
    expect(r4.action).toBe("add");

    const r5 = await s.send("done");
    expectValid(r5);
    expect(["checkout", "unknown"]).toContain(r5.action);

    s.printLog();
    console.log(`  RESULT: Terse order handled: ${s.cartItems.length} items`);
  }, 90000);

  // ─── 10. Quantity corrections ───
  it("Conv 10: Quantity changes — 'make that 3 instead of 2' (4 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("two cheeseburgers please");
    expectValid(r1);
    expect(r1.action).toBe("add");

    const r2 = await s.send("sorry, make that three cheeseburgers");
    expectValid(r2);
    expect(["modify", "add"]).toContain(r2.action);

    const r3 = await s.send("and five medium fries");
    expectValid(r3);
    expect(r3.action).toBe("add");

    const r4 = await s.send("checkout");
    expectValid(r4);

    s.printLog();
  }, 90000);
});

// ═══════════════════════════════════════════════════════
//  UPGRADE / UPSELL / SIZING SCENARIOS
// ═══════════════════════════════════════════════════════

describe("Upgrade & Upsell Scenarios", () => {

  // ─── 11. Upsizing fries ───
  it("Conv 11: Upsize — 'make the fries large' (3 turns)", async () => {
    const s = new ConversationSession();

    await s.send("Big Mac with medium fries");

    const r2 = await s.send("can you upsize the fries to large");
    expectValid(r2);
    expect(["modify", "add", "remove"]).toContain(r2.action);
    expect(r2.items.some(i => i.name.toLowerCase().includes("large") && i.name.toLowerCase().includes("fries"))).toBe(true);

    const r3 = await s.send("that's it");
    expectValid(r3);

    s.printLog();
    console.log(`  RESULT: Fries upsized`);
  }, 60000);

  // ─── 12. Upsizing drink ───
  it("Conv 12: Upsize drink — 'make the coke large' (3 turns)", async () => {
    const s = new ConversationSession();

    await s.send("McChicken and a medium coke");

    const r2 = await s.send("actually make that a large coke");
    expectValid(r2);
    expect(["modify", "add"]).toContain(r2.action);
    // The LLM may name it "Large Coca-Cola" or just "Coca-Cola" with size context
    expect(r2.items.some(i =>
      i.name.toLowerCase().includes("large") ||
      i.name.toLowerCase().includes("coke") ||
      i.name.toLowerCase().includes("coca")
    )).toBe(true);

    const r3 = await s.send("done");
    expectValid(r3);

    s.printLog();
  }, 60000);

  // ─── 13. Responding to drink suggestion ───
  it("Conv 13: Casey suggests drink -> customer accepts (3 turns)", async () => {
    const s = new ConversationSession();

    await s.send("10 piece nuggets and medium fries");

    s.history.push({ role: "assistant", text: "Can I get you a drink to go with your meal?" });

    const r2 = await s.send("yeah, a medium sprite");
    expectValid(r2);
    expect(r2.action).toBe("add");
    expect(r2.items.some(i => i.name.toLowerCase().includes("sprite"))).toBe(true);

    const r3 = await s.send("that's all");
    expectValid(r3);

    s.printLog();
  }, 60000);

  // ─── 14. Double upgrade — sandwich then meal ───
  it("Conv 14: Upgrade sandwich -> then upgrade to meal (4 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("I want a McDouble");
    expectValid(r1);
    expect(r1.action).toBe("add");

    const r2 = await s.send("actually upgrade that to a Double Cheeseburger");
    expectValid(r2);
    expect(["modify", "add"]).toContain(r2.action);

    s.history.push({ role: "assistant", text: "Would you like to make that a Double Cheeseburger Meal?" });

    const r3 = await s.send("yes please, the meal", "[PENDING_MEAL_OFFER: Double Cheeseburger Meal]");
    expectValid(r3);
    expect(["meal_response", "add"]).toContain(r3.action);

    const r4 = await s.send("that's it");
    expectValid(r4);

    s.printLog();
    console.log(`  RESULT: McDouble -> Double Cheeseburger -> Meal`);
  }, 90000);

  // ─── 15. Adding multiple sizes in one request ───
  it("Conv 15: Mixed sizes — 'one small one large fries' (2 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("I want one small fries and one large fries");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items.length).toBeGreaterThanOrEqual(2);

    const r2 = await s.send("and two medium cokes");
    expectValid(r2);
    expect(r2.action).toBe("add");

    s.printLog();
  }, 60000);
});

// ═══════════════════════════════════════════════════════
//  CUSTOMIZATION SCENARIOS
// ═══════════════════════════════════════════════════════

describe("Customization Scenarios", () => {

  // ─── 16. Multiple customizations on one item ───
  it("Conv 16: Heavy customization — 'Big Mac no pickles no onions extra cheese add bacon' (2 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Big Mac with no pickles, no onions, extra cheese, and add bacon");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items[0].customizations.length).toBeGreaterThanOrEqual(2);
    console.log(`  Customizations: ${r1.items[0].customizations.join(", ")}`);

    const r2 = await s.send("that's all");
    expectValid(r2);

    s.printLog();
  }, 60000);

  // ─── 17. Adding customization after ordering ───
  it("Conv 17: Add customization after — 'oh and no ketchup on that' (3 turns)", async () => {
    const s = new ConversationSession();

    await s.send("Quarter Pounder please");

    const r2 = await s.send("oh wait, can you make that with no ketchup and extra pickles");
    expectValid(r2);
    expect(["modify", "add"]).toContain(r2.action);
    const hasCustom = r2.items.some(i => i.customizations.length > 0);
    expect(hasCustom).toBe(true);

    const r3 = await s.send("perfect, that's all");
    expectValid(r3);

    s.printLog();
  }, 60000);

  // ─── 18. Different customizations on same item ───
  it("Conv 18: Two of same item, different customs — 'one regular one no pickles' (2 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("two Big Macs, one regular and one with no pickles");
    expectValid(r1);
    expect(r1.action).toBe("add");
    // Should have at least 1 item
    expect(r1.items.length).toBeGreaterThanOrEqual(1);

    const r2 = await s.send("that's it");
    expectValid(r2);

    s.printLog();
  }, 60000);
});

// ═══════════════════════════════════════════════════════
//  EDGE CASES & ERROR RECOVERY
// ═══════════════════════════════════════════════════════

describe("Edge Cases & Error Recovery", () => {

  // ─── 19. Non-existent item ───
  it("Conv 19: Item not on menu — 'I want a Whopper' (2 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Can I get a Whopper");
    expectValid(r1);
    // Should be unknown or low confidence, maybe suggest alternatives
    const isUncertain = r1.action === "unknown" ||
      r1.clarificationNeeded !== undefined ||
      r1.items.every(i => i.confidence < 0.7);
    expect(isUncertain || r1.response.toLowerCase().includes("don't")).toBe(true);

    // Recovery: order something real
    const r2 = await s.send("oh right this is McDonald's, give me a Big Mac then");
    expectValid(r2);
    expect(r2.action).toBe("add");
    expect(r2.items[0].name).toContain("Big Mac");

    s.printLog();
  }, 60000);

  // ─── 20. Gibberish then real order ───
  it("Conv 20: Gibberish -> recover -> order (3 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("uhhhh hmm aaaa I dunno");
    expectValid(r1);
    expect(r1.action).toBe("unknown");

    const r2 = await s.send("sorry, let me get a McChicken");
    expectValid(r2);
    expect(r2.action).toBe("add");

    const r3 = await s.send("that's all");
    expectValid(r3);

    s.printLog();
  }, 60000);

  // ─── 21. Empty cart checkout attempt ───
  it("Conv 21: Try to checkout with empty cart (2 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("I'm done, checkout");
    expectValid(r1);
    // Should recognize checkout but cart is empty context
    expect(["checkout", "unknown"]).toContain(r1.action);

    const r2 = await s.send("oh I forgot to order. Give me a Big Mac");
    expectValid(r2);
    expect(r2.action).toBe("add");

    s.printLog();
  }, 60000);

  // ─── 22. Removing something not in cart ───
  it("Conv 22: Remove non-existent item from cart (2 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Big Mac please");
    expectValid(r1);

    const r2 = await s.send("remove the chicken nuggets");
    expectValid(r2);
    // Should still process — may say it's not in cart
    expect(r2.action).toBe("remove");

    s.printLog();
  }, 60000);

  // ─── 23. Very long single request ───
  it("Conv 23: Extremely long single request (1 turn)", async () => {
    const r = await sendNLP(
      "ok so I need two Big Macs, one Quarter Pounder with Cheese with no pickles and extra cheese, " +
      "three medium fries, two large cokes, one small sprite, a 10 piece chicken mcnuggets, " +
      "two McFlurry with Oreo, and a vanilla cone"
    );
    expectValid(r);
    expect(r.action).toBe("add");
    expect(r.items.length).toBeGreaterThanOrEqual(5);
    const totalQty = r.items.reduce((sum, i) => sum + i.quantity, 0);
    expect(totalQty).toBeGreaterThanOrEqual(8);
    console.log(`  Parsed ${r.items.length} distinct items, total qty ${totalQty}`);
    console.log(`  Items: ${r.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}`);
  }, 30000);

  // ─── 24. Repeated same item ───
  it("Conv 24: Same item ordered multiple times across turns (3 turns)", async () => {
    const s = new ConversationSession();

    await s.send("one Big Mac");
    await s.send("add another Big Mac");

    const r3 = await s.send("actually make that 5 Big Macs total");
    expectValid(r3);
    // Should handle quantity update
    expect(["add", "modify"]).toContain(r3.action);

    s.printLog();
  }, 60000);
});

// ═══════════════════════════════════════════════════════
//  SPECIAL CUSTOMER TYPES
// ═══════════════════════════════════════════════════════

describe("Special Customer Types", () => {

  // ─── 25. Kid ordering Happy Meal ───
  it("Conv 25: Kid ordering Happy Meal (3 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Can I get a Happy Meal with nuggets");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items.some(i => i.name.toLowerCase().includes("happy meal") || i.name.toLowerCase().includes("nugget"))).toBe(true);

    const r2 = await s.send("and can I get a chocolate milk with that");
    expectValid(r2);
    expect(r2.action).toBe("add");

    const r3 = await s.send("that's all thanks!");
    expectValid(r3);

    s.printLog();
  }, 60000);

  // ─── 26. Breakfast order ───
  it("Conv 26: Full breakfast order (4 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Egg McMuffin and a hash brown");
    expectValid(r1);
    expect(r1.action).toBe("add");

    const r2 = await s.send("and a hot coffee");
    expectValid(r2);
    expect(r2.action).toBe("add");

    const r3 = await s.send("add a sausage burrito too");
    expectValid(r3);
    expect(r3.action).toBe("add");

    const r4 = await s.send("I'm good");
    expectValid(r4);

    s.printLog();
    console.log(`  RESULT: Breakfast order: ${s.cartSummary}`);
  }, 90000);

  // ─── 27. Indecisive customer ───
  it("Conv 27: Indecisive — keeps changing order (6 turns)", async () => {
    const s = new ConversationSession();

    await s.send("I want a Big Mac");
    await s.send("no wait, a Quarter Pounder");
    await s.send("hmm actually the McChicken");

    const r4 = await s.send("you know what, give me a Crispy Chicken Sandwich");
    expectValid(r4);

    const r5 = await s.send("and medium fries");
    expectValid(r5);

    const r6 = await s.send("ok that's final, I'm done");
    expectValid(r6);

    s.printLog();
  }, 120000);

  // ─── 28. Customer asking about prices ───
  it("Conv 28: Price inquiry then order (3 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("how much is a Big Mac");
    expectValid(r1);
    // Response should mention a price
    const mentionsPrice = r1.response.includes("$") || r1.response.toLowerCase().includes("price");
    // Even if it doesn't know exact price, it shouldn't crash
    expect(r1.response.length).toBeGreaterThan(5);

    const r2 = await s.send("ok give me one");
    expectValid(r2);
    expect(r2.action).toBe("add");

    const r3 = await s.send("that's all");
    expectValid(r3);

    s.printLog();
    console.log(`  Price mentioned: ${mentionsPrice}`);
  }, 60000);

  // ─── 29. Ordering by number/description ───
  it("Conv 29: Vague description — 'the fish sandwich' (2 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("can I get the fish sandwich");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items.some(i => i.name.toLowerCase().includes("filet") || i.name.toLowerCase().includes("fish"))).toBe(true);

    const r2 = await s.send("done");
    expectValid(r2);

    s.printLog();
  }, 60000);

  // ─── 30. Mixing breakfast and regular items ───
  it("Conv 30: Mix breakfast + regular items (3 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Sausage McMuffin with Egg please");
    expectValid(r1);
    expect(r1.action).toBe("add");

    const r2 = await s.send("and a Big Mac for later");
    expectValid(r2);
    expect(r2.action).toBe("add");

    const r3 = await s.send("and two medium fries, that's it");
    expectValid(r3);

    s.printLog();
    console.log(`  RESULT: Mixed breakfast+lunch: ${s.cartSummary}`);
  }, 60000);
});

// ═══════════════════════════════════════════════════════
//  CORRECTION & MULTI-TURN INTELLIGENCE
// ═══════════════════════════════════════════════════════

describe("Correction & Context Intelligence", () => {

  // ─── 31. Correcting quantity ───
  it("Conv 31: Correct quantity — 'I said 2 not 1' (3 turns)", async () => {
    const s = new ConversationSession();

    await s.send("one McChicken");

    const r2 = await s.send("no I meant two McChickens");
    expectValid(r2);
    expect(["modify", "add"]).toContain(r2.action);
    const mcChicken = r2.items.find(i => i.name.toLowerCase().includes("chicken"));
    if (mcChicken) expect(mcChicken.quantity).toBeGreaterThanOrEqual(2);

    const r3 = await s.send("that's right, checkout");
    expectValid(r3);

    s.printLog();
  }, 60000);

  // ─── 32. Switching drink type ───
  it("Conv 32: Switch drink — 'change coke to sprite' (3 turns)", async () => {
    const s = new ConversationSession();

    await s.send("Big Mac, medium fries, and a medium coke");

    const r2 = await s.send("switch the coke to a sprite");
    expectValid(r2);
    expect(["modify", "add", "remove"]).toContain(r2.action);
    expect(r2.items.some(i => i.name.toLowerCase().includes("sprite"))).toBe(true);

    const r3 = await s.send("perfect, done");
    expectValid(r3);

    s.printLog();
  }, 60000);

  // ─── 33. Adding to previous order context ───
  it("Conv 33: 'Add one more of those' referring to previous item (3 turns)", async () => {
    const s = new ConversationSession();

    await s.send("10 piece nuggets");

    const r2 = await s.send("actually give me another one of those");
    expectValid(r2);
    expect(r2.action).toBe("add");
    // Should understand "those" = nuggets
    expect(r2.items.some(i => i.name.toLowerCase().includes("nugget"))).toBe(true);

    const r3 = await s.send("that's all");
    expectValid(r3);

    s.printLog();
  }, 60000);

  // ─── 34. Complete order replacement ───
  it("Conv 34: 'Forget everything, just give me...' (3 turns)", async () => {
    const s = new ConversationSession();

    await s.send("two Big Macs, large fries, two cokes, McFlurry");

    const r2 = await s.send("forget all that, just give me a 20 piece nuggets and a large coke");
    expectValid(r2);
    expect(["clear", "modify"]).toContain(r2.action);

    // If it was "clear", send the new order
    if (r2.action === "clear") {
      s.cartItems = [];
      const r3 = await s.send("20 piece nuggets and a large coke");
      expectValid(r3);
      expect(r3.action).toBe("add");
    }

    s.printLog();
  }, 60000);

  // ─── 35. Confirming order readback ───
  it("Conv 35: 'What do I have so far?' mid-order (4 turns)", async () => {
    const s = new ConversationSession();

    await s.send("Big Mac and medium fries");
    await s.send("add a coke");

    const r3 = await s.send("what do I have in my order, can you read it back");
    expectValid(r3);
    // LLM may treat as unknown (no ordering action) or try to summarize — both ok
    // Just verify it gives a non-empty response without erroring
    expect(r3.response.length).toBeGreaterThan(5);

    const r4 = await s.send("ok that's good, checkout");
    expectValid(r4);

    s.printLog();
  }, 90000);
});

// ═══════════════════════════════════════════════════════
//  DESSERT & SIDE FOCUSED
// ═══════════════════════════════════════════════════════

describe("Desserts & Sides Focus", () => {

  // ─── 36. Dessert-only order ───
  it("Conv 36: Desserts only — McFlurry + Sundae + Cone (2 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("I just want desserts. An Oreo McFlurry, a hot fudge sundae, and a vanilla cone");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items.length).toBeGreaterThanOrEqual(2);

    const r2 = await s.send("that's all I want");
    expectValid(r2);

    s.printLog();
    console.log(`  RESULT: Dessert order: ${r1.items.map(i => i.name).join(", ")}`);
  }, 60000);

  // ─── 37. Side salad with modifications ───
  it("Conv 37: Side salad order (2 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("can I get a side salad");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items.some(i => i.name.toLowerCase().includes("salad"))).toBe(true);

    const r2 = await s.send("and small fries, that's it");
    expectValid(r2);

    s.printLog();
  }, 60000);

  // ─── 38. Apple slices for kids ───
  it("Conv 38: Apple slices with Happy Meal (2 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Cheeseburger Happy Meal with apple slices");
    expectValid(r1);
    expect(r1.action).toBe("add");

    const r2 = await s.send("done");
    expectValid(r2);

    s.printLog();
  }, 60000);
});

// ═══════════════════════════════════════════════════════
//  NATURAL LANGUAGE VARIANTS
// ═══════════════════════════════════════════════════════

describe("Natural Language Variants", () => {

  // ─── 39. Slang and abbreviations ───
  it("Conv 39: Slang — 'QP, nuggs, and a coke' (1 turn)", async () => {
    const r = await sendNLP("gimme a QP, 10 nuggs, and a coke");
    expectValid(r);
    expect(r.action).toBe("add");
    expect(r.items.length).toBeGreaterThanOrEqual(2);
    console.log(`  Parsed: ${r.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}`);
  }, 30000);

  // ─── 40. Conversational — 'what do you recommend' ───
  it("Conv 40: Asking for recommendation (2 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("what's your most popular burger");
    expectValid(r1);
    // Should mention Big Mac or another popular item
    expect(r1.response.length).toBeGreaterThan(10);

    const r2 = await s.send("ok I'll have that one");
    expectValid(r2);
    expect(["add", "unknown"]).toContain(r2.action);

    s.printLog();
  }, 60000);

  // ─── 41. Negative phrasing ───
  it("Conv 41: 'I don't want pickles' (2 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Big Mac but I don't want any pickles or onions on it");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items[0].customizations.length).toBeGreaterThanOrEqual(1);

    const r2 = await s.send("that's it");
    expectValid(r2);

    s.printLog();
    console.log(`  Customs: ${r1.items[0].customizations.join(", ")}`);
  }, 60000);

  // ─── 42. Combo name directly ───
  it("Conv 42: Ordering by meal name — 'Big Mac Meal' (2 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("I'll take a Big Mac Meal");
    expectValid(r1);
    expect(r1.action).toBe("add");
    // Should reference Big Mac or meal
    expect(r1.items[0].name.toLowerCase()).toMatch(/big mac/);

    const r2 = await s.send("that's all");
    expectValid(r2);

    s.printLog();
  }, 60000);

  // ─── 43. 'Same thing again' with context ───
  it("Conv 43: 'same thing' after first item (3 turns)", async () => {
    const s = new ConversationSession();

    await s.send("medium coke");

    const r2 = await s.send("give me one more of the same");
    expectValid(r2);
    expect(r2.action).toBe("add");

    const r3 = await s.send("that'll do");
    expectValid(r3);

    s.printLog();
  }, 60000);

  // ─── 44. 'Couple of' and 'a few' ───
  it("Conv 44: Informal quantities — 'a couple cheeseburgers' (2 turns)", async () => {
    const r = await sendNLP("a couple of cheeseburgers and a few nuggets");
    expectValid(r);
    expect(r.action).toBe("add");
    const cheese = r.items.find(i => i.name.toLowerCase().includes("cheese"));
    if (cheese) expect(cheese.quantity).toBe(2); // "couple" = 2
    console.log(`  Parsed: ${r.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}`);
  }, 30000);

  // ─── 45. Multi-language hint (English with common non-English) ───
  it("Conv 45: 'Numero uno Big Mac por favor' (1 turn)", async () => {
    const r = await sendNLP("one Big Mac por favor");
    expectValid(r);
    expect(r.action).toBe("add");
    expect(r.items[0].name).toContain("Big Mac");
    console.log(`  Casey: "${r.response}"`);
  }, 30000);
});

// ═══════════════════════════════════════════════════════
//  FULL CHECKOUT FLOW
// ═══════════════════════════════════════════════════════

describe("Full Checkout Flows", () => {

  // ─── 46. Complete dine-in flow ───
  it("Conv 46: Full dine-in flow: order -> confirm -> dine in (5 turns)", async () => {
    const s = new ConversationSession();

    await s.send("Big Mac meal and a McFlurry");

    const r2 = await s.send("that's everything");
    expectValid(r2);

    s.history.push({ role: "assistant", text: "You have a Big Mac Meal and a McFlurry. Your total is $18.47. Shall I place the order?" });

    const r3 = await s.send("yes");
    expectValid(r3);

    s.history.push({ role: "assistant", text: "Dine in or takeout?" });

    const r4 = await s.send("dine in please", "[CHECKOUT_STEP: order_type]");
    expectValid(r4);
    // Should understand dine-in context
    expect(r4.response.toLowerCase().includes("dine") || r4.action === "meal_response" || r4.action === "unknown").toBe(true);

    s.printLog();
  }, 90000);

  // ─── 47. Complete takeout flow ───
  it("Conv 47: Full takeout flow (4 turns)", async () => {
    const s = new ConversationSession();

    await s.send("20 piece nuggets and two large fries");

    const r2 = await s.send("I'm done");
    expectValid(r2);

    s.history.push({ role: "assistant", text: "Dine in or takeout?" });

    const r3 = await s.send("takeout", "[CHECKOUT_STEP: order_type]");
    expectValid(r3);

    s.printLog();
  }, 60000);

  // ─── 48. Cancel at checkout ───
  it("Conv 48: Start checkout then change mind (4 turns)", async () => {
    const s = new ConversationSession();

    await s.send("McChicken and medium fries");

    await s.send("that's all");

    s.history.push({ role: "assistant", text: "You have 1x McChicken and 1x Medium Fries for $8.48. Shall I place the order?" });

    const r3 = await s.send("wait, add a medium sprite too", "[CHECKOUT_STEP: readback]");
    expectValid(r3);
    expect(r3.action).toBe("add");
    expect(r3.items.some(i => i.name.toLowerCase().includes("sprite"))).toBe(true);

    const r4 = await s.send("ok NOW I'm done");
    expectValid(r4);

    s.printLog();
    console.log(`  RESULT: Customer added item during checkout`);
  }, 90000);

  // ─── 49. Large order checkout ───
  it("Conv 49: Large order then checkout (3 turns)", async () => {
    const s = new ConversationSession();

    await s.send("three Big Macs, two Quarter Pounders, five medium fries, five medium cokes, and two McFlurries");

    const r2 = await s.send("place the order");
    expectValid(r2);
    expect(["checkout", "unknown"]).toContain(r2.action);

    s.printLog();
    console.log(`  RESULT: Large order checkout — ${s.cartItems.length} items`);
  }, 60000);

  // ─── 50. Order for someone else ───
  it("Conv 50: 'My friend wants a...' ordering pattern (4 turns)", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("I'll have a Big Mac");
    expectValid(r1);

    const r2 = await s.send("and my friend wants a Crispy Chicken Sandwich with no mayo");
    expectValid(r2);
    expect(r2.action).toBe("add");

    const r3 = await s.send("two medium fries and two medium cokes for both of us");
    expectValid(r3);
    expect(r3.action).toBe("add");

    const r4 = await s.send("we're all set");
    expectValid(r4);

    s.printLog();
  }, 90000);
});

// ═══════════════════════════════════════════════════════
//  HELPER
// ═══════════════════════════════════════════════════════

async function sendNLP(
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
