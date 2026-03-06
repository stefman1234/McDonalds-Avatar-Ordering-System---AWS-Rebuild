/**
 * User Journey Tests — Realistic 10-Turn Conversations
 *
 * Simulates real customers interacting with the McDonald's voice ordering system.
 * Each journey is a full conversation up to 10 turns covering: adding items,
 * modifying orders, size changes, undo, quantity corrections, asking questions,
 * customizations, clarification, and checkout.
 *
 * Uses the ConversationSession pattern with lastAdded tracking for pronoun resolution.
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
    newSize?: string;
    newQuantity?: number;
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

/**
 * Enhanced ConversationSession with lastAdded tracking for pronoun resolution.
 */
class ConversationSession {
  history: ConversationMessage[] = [];
  cartItems: Array<{ name: string; qty: number; price: number }> = [];
  turnCount = 0;
  lastAdded: string | null = null;
  log: string[] = [];

  get cartSummary(): string {
    if (this.cartItems.length === 0) return "Empty";
    return this.cartItems
      .map((i) => `${i.qty}x ${i.name} ($${i.price.toFixed(2)})`)
      .join(", ");
  }

  get totalItems(): number {
    return this.cartItems.reduce((sum, i) => sum + i.qty, 0);
  }

  get totalPrice(): number {
    return this.cartItems.reduce((sum, i) => sum + i.qty * i.price, 0);
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
        lastAdded: this.lastAdded ?? undefined,
      }),
    });
    const data: NLPResponse = await res.json();

    // Update history
    this.history.push({ role: "user", text: transcript });
    this.history.push({ role: "assistant", text: data.response });

    // Track cart changes
    if (data.action === "add") {
      for (const item of data.items) {
        const existing = this.cartItems.find((ci) => ci.name === item.name);
        if (existing) {
          existing.qty += item.quantity;
        } else {
          this.cartItems.push({
            name: item.name,
            qty: item.quantity,
            price: item.unitPrice ?? 0,
          });
        }
        this.lastAdded = item.name;
      }
    } else if (data.action === "remove") {
      for (const item of data.items) {
        this.cartItems = this.cartItems.filter(
          (ci) => !ci.name.toLowerCase().includes(item.name.toLowerCase())
        );
      }
    } else if (data.action === "clear") {
      this.cartItems = [];
      this.lastAdded = null;
    } else if (data.action === "modify" || data.action === "modify_size") {
      for (const item of data.items) {
        if (item.originalName) {
          this.cartItems = this.cartItems.filter(
            (ci) => !ci.name.toLowerCase().includes(item.originalName!.toLowerCase())
          );
        }
        const qty = item.newQuantity ?? item.quantity ?? 1;
        const existing = this.cartItems.find((ci) => ci.name === item.name);
        if (existing) {
          existing.qty = qty;
        } else {
          this.cartItems.push({
            name: item.name,
            qty,
            price: item.unitPrice ?? 0,
          });
        }
        this.lastAdded = item.name;
      }
    } else if (data.action === "undo") {
      // Undo removes the last added item from our tracking
      if (this.lastAdded) {
        this.cartItems = this.cartItems.filter(
          (ci) => ci.name !== this.lastAdded
        );
        this.lastAdded = this.cartItems.length > 0
          ? this.cartItems[this.cartItems.length - 1].name
          : null;
      }
    }

    // Log
    this.log.push(`  Turn ${this.turnCount}: USER: "${transcript}"`);
    this.log.push(
      `    -> action=${data.action} items=[${data.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}]`
    );
    this.log.push(`    -> CASEY: "${data.response}"`);
    this.log.push(`    -> Cart: ${this.cartSummary}`);
    if (this.lastAdded) this.log.push(`    -> lastAdded: ${this.lastAdded}`);

    return data;
  }

  printLog() {
    console.log(this.log.join("\n"));
  }

  printSummary() {
    console.log(`  SUMMARY: ${this.turnCount} turns, ${this.totalItems} items, $${this.totalPrice.toFixed(2)} total`);
    console.log(`  CART: ${this.cartSummary}`);
  }
}

function expectValid(r: NLPResponse) {
  expect(r).toHaveProperty("action");
  expect(r).toHaveProperty("response");
  expect(typeof r.response).toBe("string");
  expect(r.response.length).toBeGreaterThan(0);
  expect(r._error).toBeUndefined();
}

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 1: Casual Lunch — Build, Modify, Upsize, Checkout
// ═══════════════════════════════════════════════════════════════════

describe("Journey 1: Casual Lunch Customer (10 turns)", () => {
  it("orders, modifies, upsizes, adds dessert, and checks out", async () => {
    const s = new ConversationSession();

    // Turn 1: Greeting and first item
    const r1 = await s.send("Hey! Can I get a Big Mac please?");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items[0].name.toLowerCase()).toContain("big mac");

    // Turn 2: Add a side
    const r2 = await s.send("and medium fries");
    expectValid(r2);
    expect(r2.action).toBe("add");
    expect(r2.items.some((i) => i.name.toLowerCase().includes("fries"))).toBe(true);

    // Turn 3: Add a drink
    const r3 = await s.send("medium coke too");
    expectValid(r3);
    expect(r3.action).toBe("add");

    // Turn 4: Upsize the fries
    const r4 = await s.send("actually, can you make the fries large?");
    expectValid(r4);
    expect(["modify", "modify_size", "add"]).toContain(r4.action);

    // Turn 5: Upsize the drink too
    const r5 = await s.send("and make the coke large as well");
    expectValid(r5);
    expect(["modify", "modify_size", "add"]).toContain(r5.action);

    // Turn 6: Ask about desserts
    const r6 = await s.send("what desserts do you have?");
    expectValid(r6);
    expect(["info", "unknown"]).toContain(r6.action);
    expect(r6.response.length).toBeGreaterThan(10);

    // Turn 7: Add a dessert
    const r7 = await s.send("I'll take a McFlurry with Oreo");
    expectValid(r7);
    expect(r7.action).toBe("add");

    // Turn 8: Check order
    const r8 = await s.send("what's in my order so far?");
    expectValid(r8);
    expect(["info", "unknown"]).toContain(r8.action);
    expect(r8.response.length).toBeGreaterThan(10);

    // Turn 9: Add one more thing
    const r9 = await s.send("add a vanilla cone too");
    expectValid(r9);
    expect(r9.action).toBe("add");

    // Turn 10: Checkout
    const r10 = await s.send("ok that's everything, I'm done");
    expectValid(r10);
    expect(["checkout", "unknown"]).toContain(r10.action);

    s.printLog();
    s.printSummary();
    expect(s.turnCount).toBe(10);
  }, 180000);
});

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 2: Indecisive Customer — Changes Mind Multiple Times
// ═══════════════════════════════════════════════════════════════════

describe("Journey 2: Indecisive Customer (10 turns)", () => {
  it("orders, changes mind, removes, re-adds, and finally checks out", async () => {
    const s = new ConversationSession();

    // Turn 1: Start with a burger
    const r1 = await s.send("I'll have a Big Mac");
    expectValid(r1);
    expect(r1.action).toBe("add");

    // Turn 2: Change to something else
    const r2 = await s.send("wait no, change that to a Quarter Pounder");
    expectValid(r2);
    expect(["modify", "add", "remove"]).toContain(r2.action);
    expect(r2.items.some((i) => i.name.toLowerCase().includes("quarter"))).toBe(true);

    // Turn 3: Add fries
    const r3 = await s.send("and medium fries");
    expectValid(r3);
    expect(r3.action).toBe("add");

    // Turn 4: Change fries size
    const r4 = await s.send("hmm, actually make those small fries");
    expectValid(r4);
    expect(["modify", "modify_size", "add"]).toContain(r4.action);

    // Turn 5: Add a drink
    const r5 = await s.send("I'll have a medium sprite");
    expectValid(r5);
    expect(r5.action).toBe("add");

    // Turn 6: Switch the drink
    const r6 = await s.send("actually switch the sprite to a coke");
    expectValid(r6);
    expect(["modify", "add", "remove"]).toContain(r6.action);

    // Turn 7: Remove the fries entirely
    const r7 = await s.send("take the fries off, I don't want them anymore");
    expectValid(r7);
    expect(r7.action).toBe("remove");

    // Turn 8: Re-add fries (can't resist)
    const r8 = await s.send("ok fine, add large fries back");
    expectValid(r8);
    expect(r8.action).toBe("add");

    // Turn 9: Ask for the order total
    const r9 = await s.send("how much is my order?");
    expectValid(r9);
    expect(["info", "unknown"]).toContain(r9.action);
    expect(r9.response.length).toBeGreaterThan(5);

    // Turn 10: Checkout
    const r10 = await s.send("alright I'm done, checkout please");
    expectValid(r10);
    expect(["checkout", "unknown"]).toContain(r10.action);

    s.printLog();
    s.printSummary();
    expect(s.turnCount).toBe(10);
  }, 180000);
});

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 3: Family Order — Multiple People Ordering Sequentially
// ═══════════════════════════════════════════════════════════════════

describe("Journey 3: Family Order (10 turns)", () => {
  it("orders for 4 family members across 10 turns", async () => {
    const s = new ConversationSession();

    // Turn 1: Dad orders
    const r1 = await s.send("ok we're ordering for the whole family. I'll have a Big Mac meal");
    expectValid(r1);
    expect(r1.action).toBe("add");

    // Turn 2: Mom orders
    const r2 = await s.send("my wife wants a McChicken with no mayo and a side salad");
    expectValid(r2);
    expect(r2.action).toBe("add");

    // Turn 3: Kid 1
    const r3 = await s.send("and a Happy Meal with nuggets for my son");
    expectValid(r3);
    expect(r3.action).toBe("add");

    // Turn 4: Kid 2
    const r4 = await s.send("my daughter wants a cheeseburger Happy Meal");
    expectValid(r4);
    expect(r4.action).toBe("add");

    // Turn 5: Extra drinks
    const r5 = await s.send("we need two medium sprites for the kids");
    expectValid(r5);
    expect(r5.action).toBe("add");

    // Turn 6: Mom changes her mind
    const r6 = await s.send("oh wait, my wife says change the McChicken to a Crispy Chicken Sandwich");
    expectValid(r6);
    expect(["modify", "add"]).toContain(r6.action);

    // Turn 7: Dad adds dessert
    const r7 = await s.send("I want a McFlurry with Oreo for dessert");
    expectValid(r7);
    expect(r7.action).toBe("add");

    // Turn 8: Quantity correction
    const r8 = await s.send("actually make that two McFlurries, one for the wife too");
    expectValid(r8);
    expect(["modify", "add"]).toContain(r8.action);

    // Turn 9: Ask for total
    const r9 = await s.send("what's the total looking like?");
    expectValid(r9);
    expect(["info", "unknown"]).toContain(r9.action);
    expect(r9.response.length).toBeGreaterThan(5);

    // Turn 10: Checkout
    const r10 = await s.send("ok that's everything for us, checkout");
    expectValid(r10);
    expect(["checkout", "unknown"]).toContain(r10.action);

    s.printLog();
    s.printSummary();
    expect(s.turnCount).toBe(10);
    expect(s.totalItems).toBeGreaterThanOrEqual(6);
  }, 180000);
});

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 4: Undo Expert — Uses Undo and Corrections Heavily
// ═══════════════════════════════════════════════════════════════════

describe("Journey 4: Undo and Corrections (8 turns)", () => {
  it("adds items, undoes, corrects quantities, and modifies sizes", async () => {
    const s = new ConversationSession();

    // Turn 1: Add a burger
    const r1 = await s.send("give me a Big Mac");
    expectValid(r1);
    expect(r1.action).toBe("add");

    // Turn 2: Add nuggets
    const r2 = await s.send("and a 10 piece nuggets");
    expectValid(r2);
    expect(r2.action).toBe("add");

    // Turn 3: Undo the nuggets
    const r3 = await s.send("undo that, I don't want nuggets");
    expectValid(r3);
    expect(["undo", "remove"]).toContain(r3.action);

    // Turn 4: Add fries instead ("instead" may trigger modify or add)
    const r4 = await s.send("give me medium fries instead");
    expectValid(r4);
    expect(["add", "modify"]).toContain(r4.action);

    // Turn 5: Quantity correction
    const r5 = await s.send("I said 2 Big Macs not 1");
    expectValid(r5);
    expect(["modify", "add"]).toContain(r5.action);

    // Turn 6: Size change using pronoun
    const r6 = await s.send("make the fries large");
    expectValid(r6);
    expect(["modify", "modify_size", "add"]).toContain(r6.action);

    // Turn 7: Add drink
    const r7 = await s.send("and two large cokes");
    expectValid(r7);
    expect(r7.action).toBe("add");

    // Turn 8: Done
    const r8 = await s.send("that's it, place the order");
    expectValid(r8);
    expect(["checkout", "unknown"]).toContain(r8.action);

    s.printLog();
    s.printSummary();
    expect(s.turnCount).toBe(8);
  }, 150000);
});

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 5: Curious Customer — Asks Questions Before Ordering
// ═══════════════════════════════════════════════════════════════════

describe("Journey 5: Curious Customer (10 turns)", () => {
  it("asks questions about the menu, prices, and recommendations before ordering", async () => {
    const s = new ConversationSession();

    // Turn 1: Ask for recommendations
    const r1 = await s.send("what's your most popular item?");
    expectValid(r1);
    expect(["info", "unknown"]).toContain(r1.action);
    expect(r1.response.length).toBeGreaterThan(10);

    // Turn 2: Ask about a specific item
    const r2 = await s.send("how much is the Big Mac?");
    expectValid(r2);
    expect(["info", "unknown"]).toContain(r2.action);
    expect(r2.response.length).toBeGreaterThan(5);

    // Turn 3: Ask about another category
    const r3 = await s.send("what chicken sandwiches do you have?");
    expectValid(r3);
    expect(["info", "unknown"]).toContain(r3.action);
    expect(r3.response.length).toBeGreaterThan(10);

    // Turn 4: Ask about nuggets
    const r4 = await s.send("do you have 20 piece nuggets?");
    expectValid(r4);
    expect(["info", "unknown", "add"]).toContain(r4.action);
    expect(r4.response.length).toBeGreaterThan(5);

    // Turn 5: Start ordering after research
    const r5 = await s.send("ok I'll have a Big Mac");
    expectValid(r5);
    expect(r5.action).toBe("add");

    // Turn 6: Add based on earlier question
    const r6 = await s.send("and the 10 piece nuggets");
    expectValid(r6);
    expect(r6.action).toBe("add");

    // Turn 7: Add drink
    const r7 = await s.send("large coke");
    expectValid(r7);
    expect(r7.action).toBe("add");

    // Turn 8: Ask about combos (GPT may interpret as info, add a meal, or unknown)
    const r8 = await s.send("is it cheaper if I get a meal?");
    expectValid(r8);
    expect(["info", "unknown", "add", "meal_response"]).toContain(r8.action);
    expect(r8.response.length).toBeGreaterThan(5);

    // Turn 9: Add more
    const r9 = await s.send("add medium fries too");
    expectValid(r9);
    expect(r9.action).toBe("add");

    // Turn 10: Checkout
    const r10 = await s.send("I'm done, checkout");
    expectValid(r10);
    expect(["checkout", "unknown"]).toContain(r10.action);

    s.printLog();
    s.printSummary();
    expect(s.turnCount).toBe(10);
  }, 180000);
});

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 6: Power User — Complex Customizations & Modifications
// ═══════════════════════════════════════════════════════════════════

describe("Journey 6: Power User with Customizations (9 turns)", () => {
  it("orders with heavy customizations, modifies mid-order, and checks out", async () => {
    const s = new ConversationSession();

    // Turn 1: Customized burger
    const r1 = await s.send("Big Mac with no pickles, no onions, and extra cheese");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items[0].customizations.length).toBeGreaterThanOrEqual(2);

    // Turn 2: Another customized item
    const r2 = await s.send("and a McChicken with no mayo, extra lettuce");
    expectValid(r2);
    expect(r2.action).toBe("add");
    expect(r2.items[0].customizations.length).toBeGreaterThanOrEqual(1);

    // Turn 3: Add sides
    const r3 = await s.send("two large fries");
    expectValid(r3);
    expect(r3.action).toBe("add");

    // Turn 4: Modify the Big Mac
    const r4 = await s.send("oh wait, add bacon to the Big Mac too");
    expectValid(r4);
    expect(["modify", "add"]).toContain(r4.action);

    // Turn 5: Add drinks
    const r5 = await s.send("one large coke and one medium sprite");
    expectValid(r5);
    expect(r5.action).toBe("add");
    expect(r5.items.length).toBeGreaterThanOrEqual(2);

    // Turn 6: Change drink
    const r6 = await s.send("switch the sprite to a Fanta");
    expectValid(r6);
    expect(["modify", "add", "remove"]).toContain(r6.action);

    // Turn 7: Add a 20 piece for sharing
    const r7 = await s.send("throw in a 20 piece chicken nuggets");
    expectValid(r7);
    expect(r7.action).toBe("add");

    // Turn 8: Add desserts
    const r8 = await s.send("and two Oreo McFlurries for dessert");
    expectValid(r8);
    expect(r8.action).toBe("add");

    // Turn 9: Checkout
    const r9 = await s.send("we're good, ring that up");
    expectValid(r9);
    expect(["checkout", "unknown"]).toContain(r9.action);

    s.printLog();
    s.printSummary();
    expect(s.turnCount).toBe(9);
    expect(s.totalItems).toBeGreaterThanOrEqual(7);
  }, 180000);
});

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 7: Quick Drive-Through — Fast, Minimal Words
// ═══════════════════════════════════════════════════════════════════

describe("Journey 7: Drive-Through Terse Customer (7 turns)", () => {
  it("orders quickly with minimal words and corrections", async () => {
    const s = new ConversationSession();

    // Turn 1: Terse order
    const r1 = await s.send("two Big Macs");
    expectValid(r1);
    expect(r1.action).toBe("add");

    // Turn 2: Terse side
    const r2 = await s.send("large fries");
    expectValid(r2);
    expect(r2.action).toBe("add");

    // Turn 3: Terse drink
    const r3 = await s.send("coke");
    expectValid(r3);
    expect(r3.action).toBe("add");

    // Turn 4: Quick correction
    const r4 = await s.send("no, three Big Macs");
    expectValid(r4);
    expect(["modify", "add"]).toContain(r4.action);

    // Turn 5: One more item
    const r5 = await s.send("nuggets");
    expectValid(r5);
    expect(r5.action).toBe("add");

    // Turn 6: Upsize
    const r6 = await s.send("upsize the coke");
    expectValid(r6);
    expect(["modify", "modify_size", "add"]).toContain(r6.action);

    // Turn 7: Done
    const r7 = await s.send("done");
    expectValid(r7);
    expect(["checkout", "unknown"]).toContain(r7.action);

    s.printLog();
    s.printSummary();
    expect(s.turnCount).toBe(7);
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 8: Clear and Restart — Customer Changes Entire Order
// ═══════════════════════════════════════════════════════════════════

describe("Journey 8: Clear and Restart (8 turns)", () => {
  it("builds an order, clears everything, starts fresh, and checks out", async () => {
    const s = new ConversationSession();

    // Turn 1: Initial order
    const r1 = await s.send("I want a Quarter Pounder, large fries, and a large coke");
    expectValid(r1);
    expect(r1.action).toBe("add");

    // Turn 2: Add more
    const r2 = await s.send("and a McFlurry");
    expectValid(r2);
    expect(r2.action).toBe("add");

    // Turn 3: Check what we have
    const r3 = await s.send("wait, read my order back to me");
    expectValid(r3);
    expect(["info", "unknown"]).toContain(r3.action);
    expect(r3.response.length).toBeGreaterThan(10);

    // Turn 4: Clear everything
    const r4 = await s.send("forget all that, start completely over");
    expectValid(r4);
    expect(r4.action).toBe("clear");
    s.cartItems = [];
    s.lastAdded = null;

    // Turn 5: New order
    const r5 = await s.send("just give me a 10 piece nuggets");
    expectValid(r5);
    expect(r5.action).toBe("add");

    // Turn 6: Add fries
    const r6 = await s.send("small fries");
    expectValid(r6);
    expect(r6.action).toBe("add");

    // Turn 7: Add drink
    const r7 = await s.send("and a medium sprite");
    expectValid(r7);
    expect(r7.action).toBe("add");

    // Turn 8: Checkout
    const r8 = await s.send("that's it, I'm done");
    expectValid(r8);
    expect(["checkout", "unknown"]).toContain(r8.action);

    s.printLog();
    s.printSummary();
    expect(s.turnCount).toBe(8);
  }, 150000);
});

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 9: Breakfast to Lunch Crossover
// ═══════════════════════════════════════════════════════════════════

describe("Journey 9: Breakfast-Lunch Crossover (9 turns)", () => {
  it("orders breakfast items, adds lunch items, modifies, and checks out", async () => {
    const s = new ConversationSession();

    // Turn 1: Breakfast item
    const r1 = await s.send("Egg McMuffin please");
    expectValid(r1);
    expect(r1.action).toBe("add");

    // Turn 2: Another breakfast item
    const r2 = await s.send("and a hash brown");
    expectValid(r2);
    expect(r2.action).toBe("add");

    // Turn 3: Coffee
    const r3 = await s.send("hot coffee too");
    expectValid(r3);
    expect(r3.action).toBe("add");

    // Turn 4: Add lunch item for later
    const r4 = await s.send("can I also get a Big Mac for later?");
    expectValid(r4);
    expect(r4.action).toBe("add");

    // Turn 5: Add sides for the Big Mac ("with that" may trigger modify or add)
    const r5 = await s.send("medium fries with that Big Mac");
    expectValid(r5);
    expect(["add", "modify"]).toContain(r5.action);

    // Turn 6: Quantity correction on hash browns
    const r6 = await s.send("make it two hash browns actually");
    expectValid(r6);
    expect(["modify", "add"]).toContain(r6.action);

    // Turn 7: Remove the coffee, switch to OJ
    const r7 = await s.send("remove the coffee, give me an orange juice instead");
    expectValid(r7);
    expect(["remove", "modify"]).toContain(r7.action);

    // Turn 8: Add OJ if it was just remove
    if (r7.action === "remove") {
      const r8 = await s.send("add a medium orange juice");
      expectValid(r8);
      expect(r8.action).toBe("add");
    } else {
      // Modify handled both
      const r8 = await s.send("add a sausage burrito too");
      expectValid(r8);
      expect(r8.action).toBe("add");
    }

    // Turn 9: Checkout
    const r9 = await s.send("ring me up!");
    expectValid(r9);
    expect(["checkout", "unknown"]).toContain(r9.action);

    s.printLog();
    s.printSummary();
  }, 180000);
});

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 10: Polite & Chatty Customer — Full 10 Turns
// ═══════════════════════════════════════════════════════════════════

describe("Journey 10: Polite Chatty Customer (10 turns)", () => {
  it("has a friendly conversation while building an order", async () => {
    const s = new ConversationSession();

    // Turn 1: Friendly greeting
    const r1 = await s.send("Hi there! How are you doing today? I'd love a Big Mac if that's ok");
    expectValid(r1);
    expect(r1.action).toBe("add");

    // Turn 2: Compliment and add
    const r2 = await s.send("Wonderful! You're so helpful. Can I also get some medium fries please?");
    expectValid(r2);
    expect(r2.action).toBe("add");

    // Turn 3: Ask nicely about drinks
    const r3 = await s.send("What drinks do you recommend?");
    expectValid(r3);
    expect(["info", "unknown"]).toContain(r3.action);
    expect(r3.response.length).toBeGreaterThan(10);

    // Turn 4: Order drink based on recommendation
    const r4 = await s.send("I'll go with a medium Coca-Cola, thanks so much!");
    expectValid(r4);
    expect(r4.action).toBe("add");

    // Turn 5: Consider modifications politely
    const r5 = await s.send("Oh, would it be possible to make the fries large instead? Sorry for the trouble!");
    expectValid(r5);
    expect(["modify", "modify_size", "add"]).toContain(r5.action);

    // Turn 6: Ask about McFlurry flavors
    const r6 = await s.send("What McFlurry flavors do you have?");
    expectValid(r6);
    expect(["info", "unknown"]).toContain(r6.action);
    expect(r6.response.length).toBeGreaterThan(5);

    // Turn 7: Add dessert
    const r7 = await s.send("The Oreo one sounds amazing! I'll take one please");
    expectValid(r7);
    expect(r7.action).toBe("add");

    // Turn 8: Add for a friend
    const r8 = await s.send("Oh and my friend wants a McChicken with extra sauce");
    expectValid(r8);
    expect(r8.action).toBe("add");

    // Turn 9: Check order
    const r9 = await s.send("Could you tell me what I have so far? I want to make sure I haven't forgotten anything");
    expectValid(r9);
    expect(["info", "unknown"]).toContain(r9.action);
    expect(r9.response.length).toBeGreaterThan(10);

    // Turn 10: Checkout with thanks
    const r10 = await s.send("That's perfect! Thank you so much, I'm all set!");
    expectValid(r10);
    expect(["checkout", "unknown"]).toContain(r10.action);

    s.printLog();
    s.printSummary();
    expect(s.turnCount).toBe(10);
  }, 180000);
});

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 11: Stress Test — Rapid Modifications
// ═══════════════════════════════════════════════════════════════════

describe("Journey 11: Rapid Modifications (10 turns)", () => {
  it("makes frequent changes to test modification handling", async () => {
    const s = new ConversationSession();

    // Turn 1: Big order
    const r1 = await s.send("I want a Big Mac, McChicken, and large fries");
    expectValid(r1);
    expect(r1.action).toBe("add");

    // Turn 2: Swap Big Mac for QP
    const r2 = await s.send("change the Big Mac to a Quarter Pounder");
    expectValid(r2);
    expect(["modify", "add"]).toContain(r2.action);

    // Turn 3: Add drink
    const r3 = await s.send("add a large coke");
    expectValid(r3);
    expect(r3.action).toBe("add");

    // Turn 4: Remove McChicken
    const r4 = await s.send("take the McChicken off");
    expectValid(r4);
    expect(r4.action).toBe("remove");

    // Turn 5: Add it back with customization ("actually" may trigger modify or add)
    const r5 = await s.send("actually add it back but with no mayo");
    expectValid(r5);
    expect(["add", "modify"]).toContain(r5.action);

    // Turn 6: Add nuggets
    const r6 = await s.send("add a 10 piece nuggets");
    expectValid(r6);
    expect(r6.action).toBe("add");

    // Turn 7: Undo the nuggets
    const r7 = await s.send("undo that last thing");
    expectValid(r7);
    expect(["undo", "remove"]).toContain(r7.action);

    // Turn 8: Change fries size
    const r8 = await s.send("downsize the fries to medium");
    expectValid(r8);
    expect(["modify", "modify_size", "add"]).toContain(r8.action);

    // Turn 9: Add dessert
    const r9 = await s.send("add a vanilla cone");
    expectValid(r9);
    expect(r9.action).toBe("add");

    // Turn 10: Finalize
    const r10 = await s.send("ok I'm finally done, place it");
    expectValid(r10);
    expect(["checkout", "unknown"]).toContain(r10.action);

    s.printLog();
    s.printSummary();
    expect(s.turnCount).toBe(10);
  }, 180000);
});

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 12: Meal Deal & Combo Navigator
// ═══════════════════════════════════════════════════════════════════

describe("Journey 12: Meal Deal Navigator (8 turns)", () => {
  it("orders a meal, adds extra items, modifies the meal, and checks out", async () => {
    const s = new ConversationSession();

    // Turn 1: Order a meal
    const r1 = await s.send("I'll take a Big Mac Meal");
    expectValid(r1);
    expect(r1.action).toBe("add");

    // Turn 2: Meal upgrade response
    s.history.push({
      role: "assistant",
      text: "Would you like to make that a Big Mac Meal with medium fries and a medium drink for $11.99?",
    });
    const r2 = await s.send("yes please", "[PENDING_MEAL_OFFER: Big Mac Meal]");
    expectValid(r2);
    expect(["meal_response", "add"]).toContain(r2.action);

    // Turn 3: Upsize the meal
    const r3 = await s.send("can I upsize that to large?");
    expectValid(r3);
    expect(["modify", "modify_size", "add", "unknown"]).toContain(r3.action);

    // Turn 4: Add extra item
    const r4 = await s.send("I also want a 6 piece nuggets on the side");
    expectValid(r4);
    expect(r4.action).toBe("add");

    // Turn 5: Another meal for someone else
    const r5 = await s.send("and a McChicken Meal for my friend");
    expectValid(r5);
    expect(r5.action).toBe("add");

    // Turn 6: Add dessert
    const r6 = await s.send("two apple pies please");
    expectValid(r6);
    expect(r6.action).toBe("add");

    // Turn 7: Check total
    const r7 = await s.send("what's my total?");
    expectValid(r7);
    expect(["info", "unknown"]).toContain(r7.action);
    expect(r7.response.length).toBeGreaterThan(5);

    // Turn 8: Done
    const r8 = await s.send("place the order");
    expectValid(r8);
    expect(["checkout", "unknown"]).toContain(r8.action);

    s.printLog();
    s.printSummary();
    expect(s.turnCount).toBe(8);
  }, 150000);
});

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 13: Edge Case Marathon — Error Recovery Throughout
// ═══════════════════════════════════════════════════════════════════

describe("Journey 13: Edge Case Marathon (10 turns)", () => {
  it("handles gibberish, non-menu items, corrections, and recovers gracefully", async () => {
    const s = new ConversationSession();

    // Turn 1: Gibberish
    const r1 = await s.send("uhhh hmm what");
    expectValid(r1);
    expect(r1.action).toBe("unknown");

    // Turn 2: Non-McDonald's item
    const r2 = await s.send("can I get a Whopper?");
    expectValid(r2);
    // Should handle gracefully — either unknown or suggest alternatives
    expect(["info", "unknown"]).toContain(r2.action);
    expect(r2.response.length).toBeGreaterThan(5);

    // Turn 3: Recovery with real item
    const r3 = await s.send("oh right, give me a Big Mac");
    expectValid(r3);
    expect(r3.action).toBe("add");

    // Turn 4: Vague request — should list drinks (info) or ask for clarification
    const r4 = await s.send("and something to drink");
    expectValid(r4);
    expect(["add", "info", "unknown"]).toContain(r4.action);
    expect(r4.response.length).toBeGreaterThan(5);

    // Turn 5: Clarify the drink
    const r5 = await s.send("medium coke");
    expectValid(r5);
    expect(r5.action).toBe("add");

    // Turn 6: Try to remove something not in cart
    const r6 = await s.send("remove the nuggets");
    expectValid(r6);
    // Should handle gracefully
    expect(r6.response.length).toBeGreaterThan(5);

    // Turn 7: Add fries with weird phrasing
    const r7 = await s.send("yo gimme dem fries, large ones");
    expectValid(r7);
    expect(r7.action).toBe("add");

    // Turn 8: Contradictory request
    const r8 = await s.send("add and remove a McFlurry");
    expectValid(r8);
    // NLP will pick the dominant intent
    expect(r8.response.length).toBeGreaterThan(5);

    // Turn 9: "just add X" should ALWAYS be add
    const r9 = await s.send("just add a McFlurry");
    expectValid(r9);
    expect(r9.action).toBe("add");

    // Turn 10: Checkout
    const r10 = await s.send("I'm done");
    expectValid(r10);
    expect(["checkout", "unknown"]).toContain(r10.action);

    s.printLog();
    s.printSummary();
    expect(s.turnCount).toBe(10);
  }, 180000);
});

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 14: Dessert Lover — All Desserts
// ═══════════════════════════════════════════════════════════════════

describe("Journey 14: Dessert Lover (7 turns)", () => {
  it("orders only desserts and sweets", async () => {
    const s = new ConversationSession();

    // Turn 1: First dessert
    const r1 = await s.send("I just want desserts today. An Oreo McFlurry");
    expectValid(r1);
    expect(r1.action).toBe("add");

    // Turn 2: More desserts
    const r2 = await s.send("and a vanilla cone");
    expectValid(r2);
    expect(r2.action).toBe("add");

    // Turn 3: Cookies
    const r3 = await s.send("do you have cookies?");
    expectValid(r3);
    expect(["info", "unknown", "add"]).toContain(r3.action);
    expect(r3.response.length).toBeGreaterThan(5);

    // Turn 4: Apple pie
    const r4 = await s.send("two apple pies");
    expectValid(r4);
    expect(r4.action).toBe("add");

    // Turn 5: Ask about sundae
    const r5 = await s.send("can I get a hot fudge sundae?");
    expectValid(r5);
    expect(["add", "unknown"]).toContain(r5.action);

    // Turn 6: One more McFlurry with different flavor
    const r6 = await s.send("add an M&M McFlurry too");
    expectValid(r6);
    expect(r6.action).toBe("add");

    // Turn 7: Done
    const r7 = await s.send("that's all the desserts I want");
    expectValid(r7);
    expect(["checkout", "unknown"]).toContain(r7.action);

    s.printLog();
    s.printSummary();
    expect(s.turnCount).toBe(7);
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  JOURNEY 15: Late-Night Munchies — Big Order, Quick Changes
// ═══════════════════════════════════════════════════════════════════

describe("Journey 15: Late Night Munchies (10 turns)", () => {
  it("places a big late-night order with multiple corrections", async () => {
    const s = new ConversationSession();

    // Turn 1: Big starting order
    const r1 = await s.send("alright I need two Big Macs, a 20 piece nuggets, and two large fries");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items.length).toBeGreaterThanOrEqual(3);

    // Turn 2: Add drinks
    const r2 = await s.send("three large cokes");
    expectValid(r2);
    expect(r2.action).toBe("add");

    // Turn 3: Add more burgers
    const r3 = await s.send("throw in a McChicken and a Filet-O-Fish");
    expectValid(r3);
    expect(r3.action).toBe("add");

    // Turn 4: Quantity bump
    const r4 = await s.send("actually make the Big Macs four");
    expectValid(r4);
    expect(["modify", "add"]).toContain(r4.action);

    // Turn 5: Add McFlurries
    const r5 = await s.send("two McFlurries, one Oreo one M&M");
    expectValid(r5);
    expect(r5.action).toBe("add");

    // Turn 6: More sides
    const r6 = await s.send("add three more large fries");
    expectValid(r6);
    expect(r6.action).toBe("add");

    // Turn 7: Remove something
    const r7 = await s.send("take off the Filet-O-Fish actually");
    expectValid(r7);
    expect(r7.action).toBe("remove");

    // Turn 8: "add X instead" should be add, not modify (no old item named)
    const r8 = await s.send("add two Quarter Pounders instead");
    expectValid(r8);
    expect(r8.action).toBe("add");

    // Turn 9: Final check
    const r9 = await s.send("how many items do I have?");
    expectValid(r9);
    expect(["info", "unknown"]).toContain(r9.action);
    expect(r9.response.length).toBeGreaterThan(5);

    // Turn 10: Place it
    const r10 = await s.send("send it through");
    expectValid(r10);
    expect(["checkout", "unknown"]).toContain(r10.action);

    s.printLog();
    s.printSummary();
    expect(s.turnCount).toBe(10);
    expect(s.totalItems).toBeGreaterThanOrEqual(10);
  }, 180000);
});
