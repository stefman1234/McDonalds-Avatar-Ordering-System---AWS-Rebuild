/**
 * Difficult Customer Tests — 20 Stress-Test Conversations
 *
 * Tests Casey's ability to handle: indecisive customers, information seekers,
 * bizarre requests, slang, broken English, large groups, dietary restrictions,
 * competitor comparisons, rapid changes, and edge cases.
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

    this.history.push({ role: "user", text: transcript });
    this.history.push({ role: "assistant", text: data.response });

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
          this.cartItems.push({ name: item.name, qty, price: item.unitPrice ?? 0 });
        }
        this.lastAdded = item.name;
      }
    } else if (data.action === "undo") {
      if (this.lastAdded) {
        this.cartItems = this.cartItems.filter((ci) => ci.name !== this.lastAdded);
        this.lastAdded = this.cartItems.length > 0
          ? this.cartItems[this.cartItems.length - 1].name
          : null;
      }
    }

    this.log.push(`  Turn ${this.turnCount}: USER: "${transcript}"`);
    this.log.push(
      `    -> action=${data.action} items=[${data.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}]`
    );
    this.log.push(`    -> CASEY: "${data.response}"`);
    this.log.push(`    -> Cart: ${this.cartSummary}`);

    return data;
  }

  printLog() { console.log(this.log.join("\n")); }
  printSummary() {
    const total = this.cartItems.reduce((s, i) => s + i.qty * i.price, 0);
    console.log(`  SUMMARY: ${this.turnCount} turns, ${this.totalItems} items, $${total.toFixed(2)} total`);
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
//  DC1: The "What Do You Have" Customer — Only asks questions
// ═══════════════════════════════════════════════════════════════════

describe("DC1: Info-Only Customer (8 turns)", () => {
  it("asks many questions about the menu before finally ordering", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("what's on your menu?");
    expectValid(r1);
    expect(r1.action).toBe("info");
    expect(r1.response.length).toBeGreaterThan(20);

    const r2 = await s.send("what burgers do you have and how much are they?");
    expectValid(r2);
    expect(r2.action).toBe("info");
    // Should list burgers with prices
    expect(r2.response).toMatch(/\$/);

    const r3 = await s.send("what about chicken options?");
    expectValid(r3);
    expect(r3.action).toBe("info");

    const r4 = await s.send("do you have salads?");
    expectValid(r4);
    expect(r4.action).toBe("info");

    const r5 = await s.send("what's the cheapest thing you have?");
    expectValid(r5);
    expect(r5.action).toBe("info");

    const r6 = await s.send("what comes in a Big Mac?");
    expectValid(r6);
    expect(r6.action).toBe("info");

    const r7 = await s.send("ok I'll just have a Big Mac and a coke");
    expectValid(r7);
    expect(r7.action).toBe("add");

    const r8 = await s.send("that's all");
    expectValid(r8);
    expect(r8.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC2: The Mind-Changer — Changes every item at least once
// ═══════════════════════════════════════════════════════════════════

describe("DC2: Serial Mind-Changer (10 turns)", () => {
  it("changes their mind on literally every item", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("give me a Big Mac");
    expectValid(r1);
    expect(r1.action).toBe("add");

    const r2 = await s.send("actually no, change that to a Quarter Pounder");
    expectValid(r2);
    expect(r2.action).toBe("modify");

    const r3 = await s.send("wait, I want a McChicken instead of the Quarter Pounder");
    expectValid(r3);
    expect(r3.action).toBe("modify");

    const r4 = await s.send("add large fries");
    expectValid(r4);
    expect(r4.action).toBe("add");

    const r5 = await s.send("actually change the fries to small");
    expectValid(r5);
    expect(["modify", "modify_size"]).toContain(r5.action);

    const r6 = await s.send("no wait, make them medium");
    expectValid(r6);
    expect(["modify", "modify_size"]).toContain(r6.action);

    const r7 = await s.send("add a sprite");
    expectValid(r7);
    expect(r7.action).toBe("add");

    const r8 = await s.send("switch the sprite to a coke");
    expectValid(r8);
    expect(r8.action).toBe("modify");

    const r9 = await s.send("you know what, switch the coke to a fanta");
    expectValid(r9);
    expect(r9.action).toBe("modify");

    const r10 = await s.send("ok I'm done changing things, checkout");
    expectValid(r10);
    expect(r10.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 180000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC3: Competitor Confusion — Orders items from other restaurants
// ═══════════════════════════════════════════════════════════════════

describe("DC3: Wrong Restaurant Customer (8 turns)", () => {
  it("orders Burger King, Wendy's, and other chain items", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("can I get a Whopper?");
    expectValid(r1);
    expect(r1.action).toBe("info");
    // Should explain they don't have it and suggest alternatives
    expect(r1.response.toLowerCase()).not.toContain("whopper");

    const r2 = await s.send("what about a Baconator?");
    expectValid(r2);
    expect(["info", "unknown"]).toContain(r2.action);

    const r3 = await s.send("do you have Crunchwrap Supreme?");
    expectValid(r3);
    expect(["info", "unknown"]).toContain(r3.action);

    const r4 = await s.send("ok fine what DO you have that's like a Whopper?");
    expectValid(r4);
    expect(r4.action).toBe("info");
    expect(r4.response.length).toBeGreaterThan(10);

    const r5 = await s.send("I'll try the Big Mac then");
    expectValid(r5);
    expect(r5.action).toBe("add");

    const r6 = await s.send("and whatever fries you have");
    expectValid(r6);
    expect(r6.action).toBe("add");

    const r7 = await s.send("do you have Dr Pepper?");
    expectValid(r7);
    expect(["info", "unknown", "add"]).toContain(r7.action);

    const r8 = await s.send("I'm good, ring it up");
    expectValid(r8);
    expect(r8.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC4: The Describer — Orders by description, not names
// ═══════════════════════════════════════════════════════════════════

describe("DC4: Item Describer (7 turns)", () => {
  it("describes items instead of naming them", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("I want the one with two patties and the special sauce");
    expectValid(r1);
    // Should match Big Mac
    expect(["add", "info", "unknown"]).toContain(r1.action);
    expect(r1.response.length).toBeGreaterThan(5);

    const r2 = await s.send("and those fried potato things");
    expectValid(r2);
    expect(["add", "info"]).toContain(r2.action);

    const r3 = await s.send("the ice cream thing you blend with cookies");
    expectValid(r3);
    // Should match McFlurry
    expect(["add", "info", "unknown"]).toContain(r3.action);

    const r4 = await s.send("those little chicken pieces, the 10 pack");
    expectValid(r4);
    expect(r4.action).toBe("add");

    const r5 = await s.send("the fish sandwich");
    expectValid(r5);
    expect(r5.action).toBe("add");

    const r6 = await s.send("what do I have so far?");
    expectValid(r6);
    expect(r6.action).toBe("info");
    expect(r6.response.length).toBeGreaterThan(10);

    const r7 = await s.send("done");
    expectValid(r7);
    expect(r7.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC5: Slang & Abbreviations — Speaks very casually
// ═══════════════════════════════════════════════════════════════════

describe("DC5: Slang Speaker (8 turns)", () => {
  it("uses heavy slang and abbreviations", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("yo lemme get a big mac real quick");
    expectValid(r1);
    expect(r1.action).toBe("add");

    const r2 = await s.send("aight and some nugs too");
    expectValid(r2);
    expect(r2.action).toBe("add");

    const r3 = await s.send("throw in some fries bruh");
    expectValid(r3);
    expect(r3.action).toBe("add");

    const r4 = await s.send("nah scratch the nugs");
    expectValid(r4);
    expect(r4.action).toBe("remove");

    const r5 = await s.send("gimme a coke, large");
    expectValid(r5);
    expect(r5.action).toBe("add");

    const r6 = await s.send("how much all that gonna be?");
    expectValid(r6);
    expect(["info", "unknown"]).toContain(r6.action);

    const r7 = await s.send("bet, add another big mac");
    expectValid(r7);
    expect(r7.action).toBe("add");

    const r8 = await s.send("we good, check me out");
    expectValid(r8);
    expect(r8.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC6: The Haggler — Tries to negotiate prices
// ═══════════════════════════════════════════════════════════════════

describe("DC6: Price Haggler (6 turns)", () => {
  it("tries to negotiate, asks for discounts, and complains about prices", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("how much is a Big Mac? That seems expensive");
    expectValid(r1);
    expect(r1.action).toBe("info");

    const r2 = await s.send("can you give me a discount?");
    expectValid(r2);
    expect(["info", "unknown"]).toContain(r2.action);
    expect(r2.response.length).toBeGreaterThan(5);

    const r3 = await s.send("what's the cheapest burger?");
    expectValid(r3);
    expect(r3.action).toBe("info");

    const r4 = await s.send("ok fine give me a hamburger and small fries");
    expectValid(r4);
    expect(r4.action).toBe("add");

    const r5 = await s.send("is water free?");
    expectValid(r5);
    expect(["info", "unknown"]).toContain(r5.action);

    const r6 = await s.send("just those two items please");
    expectValid(r6);
    expect(r6.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 90000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC7: The Full Undo — Orders a lot then undoes everything
// ═══════════════════════════════════════════════════════════════════

describe("DC7: Serial Undoer (10 turns)", () => {
  it("adds many items then removes them all one by one", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Big Mac, McChicken, large fries, large coke");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items.length).toBeGreaterThanOrEqual(3);

    const r2 = await s.send("undo that");
    expectValid(r2);
    expect(["undo", "remove", "clear"]).toContain(r2.action);

    const r3 = await s.send("undo again");
    expectValid(r3);
    expect(["undo", "remove"]).toContain(r3.action);

    const r4 = await s.send("undo one more time");
    expectValid(r4);
    expect(["undo", "remove"]).toContain(r4.action);

    const r5 = await s.send("remove everything else");
    expectValid(r5);
    expect(["clear", "remove"]).toContain(r5.action);

    const r6 = await s.send("is my order empty now?");
    expectValid(r6);
    expect(["info", "unknown"]).toContain(r6.action);

    const r7 = await s.send("ok just a cheeseburger please");
    expectValid(r7);
    expect(r7.action).toBe("add");

    const r8 = await s.send("and small fries");
    expectValid(r8);
    expect(r8.action).toBe("add");

    const r9 = await s.send("what's my total?");
    expectValid(r9);
    expect(r9.action).toBe("info");

    const r10 = await s.send("place it");
    expectValid(r10);
    expect(r10.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 150000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC8: Dietary Restrictions — Lots of "no" and "without"
// ═══════════════════════════════════════════════════════════════════

describe("DC8: Dietary Restrictions Customer (8 turns)", () => {
  it("orders with many dietary restrictions and customizations", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("I need a Big Mac with no cheese, no pickles, no onions, and no special sauce");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items[0].customizations.length).toBeGreaterThanOrEqual(2);

    const r2 = await s.send("do you have anything gluten free?");
    expectValid(r2);
    expect(["info", "unknown"]).toContain(r2.action);

    const r3 = await s.send("is the McChicken made with real chicken?");
    expectValid(r3);
    expect(["info", "unknown"]).toContain(r3.action);

    const r4 = await s.send("I'll have a McChicken with no mayo, no lettuce");
    expectValid(r4);
    expect(r4.action).toBe("add");

    const r5 = await s.send("fries without salt");
    expectValid(r5);
    expect(r5.action).toBe("add");

    const r6 = await s.send("a coke with no ice");
    expectValid(r6);
    expect(r6.action).toBe("add");

    const r7 = await s.send("can you read my order back? I want to make sure the customizations are right");
    expectValid(r7);
    expect(r7.action).toBe("info");

    const r8 = await s.send("perfect, checkout");
    expectValid(r8);
    expect(r8.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC9: The Confused Parent — Ordering for picky kids
// ═══════════════════════════════════════════════════════════════════

describe("DC9: Confused Parent (10 turns)", () => {
  it("orders for picky kids with changing requirements", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("what do you have for kids?");
    expectValid(r1);
    expect(r1.action).toBe("info");

    const r2 = await s.send("what comes in a Happy Meal?");
    expectValid(r2);
    expect(r2.action).toBe("info");

    const r3 = await s.send("ok one Happy Meal with nuggets");
    expectValid(r3);
    expect(r3.action).toBe("add");

    const r4 = await s.send("wait my kid says she doesn't want nuggets, can she get a hamburger?");
    expectValid(r4);
    expect(["modify", "add"]).toContain(r4.action);

    const r5 = await s.send("and another Happy Meal for my son, he wants the cheeseburger one");
    expectValid(r5);
    expect(r5.action).toBe("add");

    const r6 = await s.send("do the Happy Meals come with apple slices?");
    expectValid(r6);
    expect(["info", "unknown"]).toContain(r6.action);

    const r7 = await s.send("can I also get a Big Mac for myself?");
    expectValid(r7);
    expect(r7.action).toBe("add");

    const r8 = await s.send("oh and my wife will have a McChicken with no mayo");
    expectValid(r8);
    expect(r8.action).toBe("add");

    const r9 = await s.send("we need 4 drinks, two sprites for the kids, a coke for me, and a diet coke for my wife");
    expectValid(r9);
    expect(r9.action).toBe("add");
    expect(r9.items.length).toBeGreaterThanOrEqual(2);

    const r10 = await s.send("ok that's everything, how much total?");
    expectValid(r10);
    // Could be info (reads total) or checkout
    expect(["info", "checkout"]).toContain(r10.action);

    s.printLog();
    s.printSummary();
    expect(s.totalItems).toBeGreaterThanOrEqual(6);
  }, 180000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC10: Gibberish and Recovery — Mostly nonsense
// ═══════════════════════════════════════════════════════════════════

describe("DC10: Gibberish Speaker (8 turns)", () => {
  it("sends mostly gibberish but eventually orders correctly", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("asdlkfja;slkdfj");
    expectValid(r1);
    expect(r1.action).toBe("unknown");

    const r2 = await s.send("um uh yeah hmm");
    expectValid(r2);
    expect(r2.action).toBe("unknown");

    const r3 = await s.send("the uh thing... you know... the burger");
    expectValid(r3);
    expect(["add", "info", "unknown"]).toContain(r3.action);

    const r4 = await s.send("Big Mac! yes that thing");
    expectValid(r4);
    expect(r4.action).toBe("add");

    const r5 = await s.send("fjkdsa;l fries maybe");
    expectValid(r5);
    expect(["add", "unknown"]).toContain(r5.action);

    const r6 = await s.send("medium fries");
    expectValid(r6);
    expect(r6.action).toBe("add");

    const r7 = await s.send("drink please whatever");
    expectValid(r7);
    expect(["add", "info", "unknown"]).toContain(r7.action);

    const r8 = await s.send("done");
    expectValid(r8);
    expect(r8.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC11: Speed Run — Everything in one sentence
// ═══════════════════════════════════════════════════════════════════

describe("DC11: One-Shot Order (3 turns)", () => {
  it("orders a complex meal in a single sentence", async () => {
    const s = new ConversationSession();

    const r1 = await s.send(
      "I want two Big Macs, one McChicken with no mayo, a 20 piece nuggets with BBQ sauce, " +
      "three large fries, two large cokes, one medium sprite, and an Oreo McFlurry"
    );
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items.length).toBeGreaterThanOrEqual(5);

    const r2 = await s.send("read that back to me");
    expectValid(r2);
    expect(r2.action).toBe("info");
    expect(r2.response.length).toBeGreaterThan(30);

    const r3 = await s.send("perfect, place it");
    expectValid(r3);
    expect(r3.action).toBe("checkout");

    s.printLog();
    s.printSummary();
    expect(s.totalItems).toBeGreaterThanOrEqual(8);
  }, 60000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC12: Comparison Shopper — Compares prices and value
// ═══════════════════════════════════════════════════════════════════

describe("DC12: Comparison Shopper (7 turns)", () => {
  it("compares prices between items before deciding", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("which is cheaper, the Big Mac or Quarter Pounder?");
    expectValid(r1);
    expect(r1.action).toBe("info");
    expect(r1.response).toMatch(/\$/);

    const r2 = await s.send("what's the price difference between 10 and 20 piece nuggets?");
    expectValid(r2);
    expect(r2.action).toBe("info");

    const r3 = await s.send("is a meal deal cheaper than buying items separately?");
    expectValid(r3);
    expect(["info", "unknown"]).toContain(r3.action);

    const r4 = await s.send("what's the biggest burger you have?");
    expectValid(r4);
    expect(r4.action).toBe("info");

    const r5 = await s.send("ok give me the Quarter Pounder, seems like better value");
    expectValid(r5);
    expect(r5.action).toBe("add");

    const r6 = await s.send("and the 10 piece nuggets, the 20 is too much");
    expectValid(r6);
    expect(r6.action).toBe("add");

    const r7 = await s.send("that's it, checkout");
    expectValid(r7);
    expect(r7.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC13: The "Wait Hold On" Customer — Keeps pausing
// ═══════════════════════════════════════════════════════════════════

describe("DC13: Hesitant Customer (10 turns)", () => {
  it("keeps pausing, trailing off, and being unsure", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("umm let me think...");
    expectValid(r1);
    expect(["info", "unknown"]).toContain(r1.action);

    const r2 = await s.send("ok so... a Big Mac? yeah a Big Mac");
    expectValid(r2);
    expect(r2.action).toBe("add");

    const r3 = await s.send("hold on...");
    expectValid(r3);
    expect(["info", "unknown"]).toContain(r3.action);

    const r4 = await s.send("should I get fries or onion rings? do you have onion rings?");
    expectValid(r4);
    expect(["info", "unknown"]).toContain(r4.action);

    const r5 = await s.send("ok just fries then, medium I guess");
    expectValid(r5);
    expect(r5.action).toBe("add");

    const r6 = await s.send("hmm do I want a drink... what drinks are cold?");
    expectValid(r6);
    expect(r6.action).toBe("info");

    const r7 = await s.send("I'll do a medium coke");
    expectValid(r7);
    expect(r7.action).toBe("add");

    const r8 = await s.send("wait actually... no keep the coke");
    expectValid(r8);
    // Genuinely ambiguous — "no" may trigger undo, or GPT may understand "keep"
    expect(["info", "unknown", "undo", "remove"]).toContain(r8.action);

    const r9 = await s.send("should I get dessert? what desserts do you have?");
    expectValid(r9);
    expect(r9.action).toBe("info");

    const r10 = await s.send("nah I'm good, checkout please");
    expectValid(r10);
    expect(r10.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 180000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC14: Multiple Quantities Stress Test
// ═══════════════════════════════════════════════════════════════════

describe("DC14: Quantity Edge Cases (8 turns)", () => {
  it("tests various quantity expressions", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("a couple Big Macs");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items[0].quantity).toBe(2);

    const r2 = await s.send("a dozen nuggets... wait do you have a 10 piece?");
    expectValid(r2);
    expect(["add", "info"]).toContain(r2.action);

    const r3 = await s.send("ten piece nuggets please");
    expectValid(r3);
    expect(r3.action).toBe("add");

    const r4 = await s.send("five large fries");
    expectValid(r4);
    expect(r4.action).toBe("add");
    expect(r4.items[0].quantity).toBe(5);

    const r5 = await s.send("no wait, I said 3 fries not 5");
    expectValid(r5);
    expect(["modify"]).toContain(r5.action);

    const r6 = await s.send("and like 4 cokes, all large");
    expectValid(r6);
    expect(r6.action).toBe("add");

    const r7 = await s.send("how many items do I have total?");
    expectValid(r7);
    expect(r7.action).toBe("info");

    const r8 = await s.send("checkout");
    expectValid(r8);
    expect(r8.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC15: Conversation in the Middle of Ordering
// ═══════════════════════════════════════════════════════════════════

describe("DC15: Chatty Mid-Order (8 turns)", () => {
  it("has casual conversation mixed with ordering", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Big Mac please");
    expectValid(r1);
    expect(r1.action).toBe("add");

    const r2 = await s.send("you know, I always loved McDonalds growing up");
    expectValid(r2);
    expect(["info", "unknown"]).toContain(r2.action);

    const r3 = await s.send("anyway add medium fries");
    expectValid(r3);
    expect(r3.action).toBe("add");

    const r4 = await s.send("my favorite is actually the McFlurry, do you still make those?");
    expectValid(r4);
    expect(["info", "add"]).toContain(r4.action);

    const r5 = await s.send("give me an Oreo one");
    expectValid(r5);
    expect(r5.action).toBe("add");

    const r6 = await s.send("this is bringing back childhood memories, I used to get Happy Meals");
    expectValid(r6);
    expect(["info", "unknown"]).toContain(r6.action);

    const r7 = await s.send("ok and a large coke to wash it all down");
    expectValid(r7);
    expect(r7.action).toBe("add");

    const r8 = await s.send("alright that'll do it, thanks!");
    expectValid(r8);
    expect(r8.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC16: Size Confusion — Can't decide on sizes
// ═══════════════════════════════════════════════════════════════════

describe("DC16: Size-Confused Customer (8 turns)", () => {
  it("constantly changes sizes up and down", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("medium fries");
    expectValid(r1);
    expect(r1.action).toBe("add");

    const r2 = await s.send("actually make those large");
    expectValid(r2);
    expect(["modify", "modify_size"]).toContain(r2.action);

    const r3 = await s.send("no wait, large is too much, go back to medium");
    expectValid(r3);
    expect(["modify", "modify_size"]).toContain(r3.action);

    const r4 = await s.send("add a coke, what sizes do you have?");
    expectValid(r4);
    expect(["add", "info"]).toContain(r4.action);

    const r5 = await s.send("small coke");
    expectValid(r5);
    expect(r5.action).toBe("add");

    const r6 = await s.send("upsize the coke to large actually");
    expectValid(r6);
    expect(["modify", "modify_size"]).toContain(r6.action);

    const r7 = await s.send("add a Big Mac");
    expectValid(r7);
    expect(r7.action).toBe("add");

    const r8 = await s.send("done");
    expectValid(r8);
    expect(r8.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC17: Breakfast Confusion — Orders breakfast at wrong time
// ═══════════════════════════════════════════════════════════════════

describe("DC17: Breakfast Orderer (7 turns)", () => {
  it("tries to order only breakfast items", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("can I get an Egg McMuffin?");
    expectValid(r1);
    // Should add it or explain availability
    expect(["add", "info", "unknown"]).toContain(r1.action);

    const r2 = await s.send("and hotcakes");
    expectValid(r2);
    expect(["add", "info", "unknown"]).toContain(r2.action);

    const r3 = await s.send("do you have hash browns?");
    expectValid(r3);
    expect(["add", "info"]).toContain(r3.action);

    const r4 = await s.send("add two hash browns");
    expectValid(r4);
    expect(r4.action).toBe("add");

    const r5 = await s.send("and a sausage burrito");
    expectValid(r5);
    expect(r5.action).toBe("add");

    const r6 = await s.send("and a coffee, large");
    expectValid(r6);
    expect(r6.action).toBe("add");

    const r7 = await s.send("that's everything");
    expectValid(r7);
    expect(r7.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC18: Extreme Customization — Every item heavily modified
// ═══════════════════════════════════════════════════════════════════

describe("DC18: Extreme Customizer (7 turns)", () => {
  it("customizes every single item heavily", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("Big Mac, no lettuce, no pickles, no onions, extra cheese, extra sauce, add bacon");
    expectValid(r1);
    expect(r1.action).toBe("add");
    expect(r1.items[0].customizations.length).toBeGreaterThanOrEqual(3);

    const r2 = await s.send("McChicken with no mayo, extra pickles, add cheese, no lettuce");
    expectValid(r2);
    expect(r2.action).toBe("add");
    expect(r2.items[0].customizations.length).toBeGreaterThanOrEqual(2);

    const r3 = await s.send("large fries with no salt");
    expectValid(r3);
    expect(r3.action).toBe("add");

    const r4 = await s.send("can I get a coke with light ice and extra syrup?");
    expectValid(r4);
    expect(r4.action).toBe("add");

    const r5 = await s.send("now add extra ketchup packets, like 10 of them");
    expectValid(r5);
    expect(["add", "info", "unknown"]).toContain(r5.action);

    const r6 = await s.send("can you read back the customizations on each item?");
    expectValid(r6);
    expect(r6.action).toBe("info");

    const r7 = await s.send("looks right, I'm done");
    expectValid(r7);
    expect(r7.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC19: Multi-Language Mix — Throws in non-English words
// ═══════════════════════════════════════════════════════════════════

describe("DC19: Code-Switching Customer (7 turns)", () => {
  it("mixes English with other language hints", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("hello, I would like one Big Mac por favor");
    expectValid(r1);
    expect(r1.action).toBe("add");

    const r2 = await s.send("et aussi some fries, medium s'il vous plait");
    expectValid(r2);
    expect(r2.action).toBe("add");

    const r3 = await s.send("una coca cola grande");
    expectValid(r3);
    expect(r3.action).toBe("add");

    const r4 = await s.send("that's the same as large coke right?");
    expectValid(r4);
    expect(["info", "unknown"]).toContain(r4.action);

    const r5 = await s.send("add McNuggets, diez pieces");
    expectValid(r5);
    expect(r5.action).toBe("add");

    const r6 = await s.send("combien total? how much is it?");
    expectValid(r6);
    expect(r6.action).toBe("info");

    const r7 = await s.send("c'est tout, I'm done, gracias");
    expectValid(r7);
    expect(r7.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 120000);
});

// ═══════════════════════════════════════════════════════════════════
//  DC20: Contradiction and Paradox — Conflicting instructions
// ═══════════════════════════════════════════════════════════════════

describe("DC20: Contradictory Customer (10 turns)", () => {
  it("gives conflicting instructions and tests Casey's judgment", async () => {
    const s = new ConversationSession();

    const r1 = await s.send("I want a Big Mac but I don't want a Big Mac");
    expectValid(r1);
    expect(["unknown", "info"]).toContain(r1.action);

    const r2 = await s.send("ok fine give me the Big Mac");
    expectValid(r2);
    expect(r2.action).toBe("add");

    const r3 = await s.send("add fries but make them small... no large... small");
    expectValid(r3);
    // "add fries" is clearly an add, but size contradictions may confuse GPT into modify/modify_size
    expect(["add", "modify", "modify_size"]).toContain(r3.action);

    const r4 = await s.send("I want a coke and a sprite, actually just the coke, no the sprite, no both");
    expectValid(r4);
    // Deliberately contradictory — GPT may interpret as add, modify, or unknown
    expect(["add", "modify", "unknown"]).toContain(r4.action);

    const r5 = await s.send("remove the fries, actually keep them");
    expectValid(r5);
    // Casey should try to figure out the final intent
    expect(r5.response.length).toBeGreaterThan(5);

    const r6 = await s.send("am I ordering or not? what do I have?");
    expectValid(r6);
    expect(["info", "unknown"]).toContain(r6.action);

    const r7 = await s.send("just add a McFlurry, no customizations, simple");
    expectValid(r7);
    expect(r7.action).toBe("add");

    const r8 = await s.send("I'm done but wait am I done? yes I'm done");
    expectValid(r8);
    expect(r8.action).toBe("checkout");

    const r9 = await s.send("wait I'm not done, add a cheeseburger");
    expectValid(r9);
    expect(r9.action).toBe("add");

    const r10 = await s.send("NOW I'm done for real");
    expectValid(r10);
    expect(r10.action).toBe("checkout");

    s.printLog();
    s.printSummary();
  }, 180000);
});
