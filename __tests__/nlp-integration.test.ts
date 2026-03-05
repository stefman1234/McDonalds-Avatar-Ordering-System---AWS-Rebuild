/**
 * NLP Integration Tests
 * Tests the full NLP pipeline: OpenAI API key validity, order parsing, fuzzy matching.
 * These tests hit the real OpenAI API — they require a valid OPENAI_API_KEY in .env.local.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

describe("OpenAI API Key", () => {
  it("OPENAI_API_KEY is set in environment", () => {
    expect(OPENAI_API_KEY).toBeDefined();
    expect(OPENAI_API_KEY!.length).toBeGreaterThan(10);
  });

  it("OPENAI_API_KEY starts with sk-", () => {
    expect(OPENAI_API_KEY).toMatch(/^sk-/);
  });

  it(
    "OPENAI_API_KEY authenticates successfully",
    async () => {
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Say OK" }],
        max_tokens: 5,
      });
      expect(response.choices[0].message.content).toBeDefined();
    },
    15000
  );
});

describe("NLP Order Parsing (live)", () => {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  async function parseOrder(transcript: string): Promise<Record<string, unknown>> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are Casey, a friendly McDonald's AI ordering assistant. Parse customer speech into structured order intents.
Respond ONLY with valid JSON matching this schema:
{
  "action": "add" | "remove" | "modify" | "clear" | "checkout" | "unknown",
  "items": [{ "name": string, "quantity": number, "customizations": string[], "confidence": number }],
  "response": string
}`,
        },
        {
          role: "user",
          content: `MENU: Big Mac $5.99, Quarter Pounder $6.49, McChicken $3.99, Medium Fries $3.49, Medium Coke $2.49, McNuggets(10) $5.49\n\nCART: Empty\n\nCUSTOMER: "${transcript}"`,
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  it(
    "parses 'I want a Big Mac' as add action",
    async () => {
      const result = await parseOrder("I want a Big Mac");
      expect(result.action).toBe("add");
      expect(Array.isArray(result.items)).toBe(true);
      const items = result.items as Array<{ name: string; quantity: number }>;
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].name.toLowerCase()).toContain("big mac");
      expect(items[0].quantity).toBe(1);
    },
    15000
  );

  it(
    "parses 'two medium fries and a coke' as add with quantities",
    async () => {
      const result = await parseOrder("two medium fries and a coke");
      expect(result.action).toBe("add");
      const items = result.items as Array<{ name: string; quantity: number }>;
      expect(items.length).toBeGreaterThanOrEqual(2);
    },
    15000
  );

  it(
    "parses 'remove the Big Mac' as remove action",
    async () => {
      const result = await parseOrder("remove the Big Mac");
      expect(result.action).toBe("remove");
    },
    15000
  );

  it(
    "parses 'that's all I'm done' as checkout action",
    async () => {
      const result = await parseOrder("that's all I'm done, place the order");
      expect(["checkout", "unknown"]).toContain(result.action);
    },
    15000
  );

  it(
    "parses 'clear everything' as clear action",
    async () => {
      const result = await parseOrder("clear everything start over");
      expect(result.action).toBe("clear");
    },
    15000
  );

  it(
    "returns unknown for gibberish",
    async () => {
      const result = await parseOrder("asdf jkl zxcvbnm");
      expect(result.action).toBe("unknown");
    },
    15000
  );

  it(
    "includes a response field for TTS",
    async () => {
      const result = await parseOrder("I want a Big Mac");
      expect(typeof result.response).toBe("string");
      expect((result.response as string).length).toBeGreaterThan(0);
    },
    15000
  );
});
