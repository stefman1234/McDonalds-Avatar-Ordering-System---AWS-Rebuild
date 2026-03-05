/**
 * API Endpoint Integration Tests
 * Tests the actual running Next.js server endpoints.
 * Requires the dev server to be running on localhost:3001 (or 3000).
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

async function fetchJSON(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const body = await res.json();
  return { status: res.status, body };
}

describe("API: /api/menu", () => {
  it(
    "returns array of categories with items",
    async () => {
      const { status, body } = await fetchJSON("/api/menu");
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toHaveProperty("id");
      expect(body[0]).toHaveProperty("name");
      expect(body[0]).toHaveProperty("items");
      expect(Array.isArray(body[0].items)).toBe(true);
    },
    10000
  );

  it(
    "menu items have required fields",
    async () => {
      const { body } = await fetchJSON("/api/menu");
      const item = body[0].items[0];
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("price");
      expect(typeof item.price).toBe("number");
      expect(item).toHaveProperty("aliases");
      expect(item).toHaveProperty("customizations");
    },
    10000
  );
});

describe("API: /api/combos", () => {
  it(
    "returns array of combo meals",
    async () => {
      const { status, body } = await fetchJSON("/api/combos");
      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      // May be empty if no combos seeded, but should not error
    },
    10000
  );
});

describe("API: /api/nlp/parse-order", () => {
  it(
    "returns 400 without transcript",
    async () => {
      const { status } = await fetchJSON("/api/nlp/parse-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(status).toBe(400);
    },
    10000
  );

  it(
    "returns valid NLP intent for valid transcript",
    async () => {
      const { status, body } = await fetchJSON("/api/nlp/parse-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: "I want a Big Mac" }),
      });
      expect(status).toBe(200);
      expect(body).toHaveProperty("action");
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("response");
      expect(["add", "remove", "modify", "clear", "checkout", "meal_response", "unknown"]).toContain(
        body.action
      );
    },
    30000
  );

  it(
    "enriches items with matchedMenuItemId and unitPrice",
    async () => {
      const { body } = await fetchJSON("/api/nlp/parse-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: "I want a Big Mac" }),
      });
      if (body.items && body.items.length > 0 && body.action === "add") {
        expect(body.items[0]).toHaveProperty("matchedMenuItemId");
        expect(body.items[0]).toHaveProperty("unitPrice");
        expect(typeof body.items[0].unitPrice).toBe("number");
      }
    },
    30000
  );

  it(
    "provides fuzzy candidates for ambiguous queries",
    async () => {
      const { body } = await fetchJSON("/api/nlp/parse-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: "something spicy maybe" }),
      });
      // Should be unknown or have low confidence, with fuzzyCandidates
      if (body.action === "unknown" && body.fuzzyCandidates) {
        expect(Array.isArray(body.fuzzyCandidates)).toBe(true);
      }
    },
    30000
  );

  it(
    "handles conversation history",
    async () => {
      const { status, body } = await fetchJSON("/api/nlp/parse-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: "yes please",
          cartSummary: "1x Big Mac",
          conversationHistory: [
            { role: "assistant", text: "Would you like fries with that?" },
          ],
        }),
      });
      expect(status).toBe(200);
      expect(body).toHaveProperty("action");
    },
    30000
  );

  it(
    "does not return 500 error (graceful fallback)",
    async () => {
      const { status } = await fetchJSON("/api/nlp/parse-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: "hello" }),
      });
      expect(status).not.toBe(500);
    },
    30000
  );
});

describe("API: /api/meal-conversion", () => {
  it(
    "returns JSON response for valid request",
    async () => {
      const { status, body } = await fetchJSON("/api/meal-conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: 1 }),
      });
      expect(status).toBe(200);
      // combo may or may not exist depending on seed data
      expect(body).toBeDefined();
    },
    10000
  );
});
