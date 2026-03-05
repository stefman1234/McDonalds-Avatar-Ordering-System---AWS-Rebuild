/**
 * Environment & Configuration Tests
 * Verifies all required environment variables and services are configured.
 */

import { config } from "dotenv";
import { Pool } from "pg";

// Load .env.local
config({ path: ".env.local" });

describe("Environment Variables", () => {
  it("OPENAI_API_KEY is set", () => {
    expect(process.env.OPENAI_API_KEY).toBeDefined();
    expect(process.env.OPENAI_API_KEY!.length).toBeGreaterThan(0);
  });

  it("OPENAI_API_KEY starts with sk-", () => {
    expect(process.env.OPENAI_API_KEY).toMatch(/^sk-/);
  });

  it("DATABASE_URL is set", () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL).toContain("postgresql://");
  });

  it("NEXT_PUBLIC_KLLEON_SDK_KEY is set", () => {
    expect(process.env.NEXT_PUBLIC_KLLEON_SDK_KEY).toBeDefined();
    expect(process.env.NEXT_PUBLIC_KLLEON_SDK_KEY!.length).toBeGreaterThan(0);
  });

  it("NEXT_PUBLIC_KLLEON_AVATAR_ID is set", () => {
    expect(process.env.NEXT_PUBLIC_KLLEON_AVATAR_ID).toBeDefined();
  });
});

describe("Database Connection", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  });

  afterAll(async () => {
    await pool.end();
  });

  it(
    "connects to PostgreSQL",
    async () => {
      const result = await pool.query("SELECT 1 as connected");
      expect(result.rows[0].connected).toBe(1);
    },
    10000
  );

  it(
    "has menu_items table with data",
    async () => {
      const result = await pool.query("SELECT COUNT(*)::int as count FROM menu_items");
      expect(result.rows[0].count).toBeGreaterThan(0);
    },
    10000
  );

  it(
    "has categories table with data",
    async () => {
      const result = await pool.query("SELECT COUNT(*)::int as count FROM categories");
      expect(result.rows[0].count).toBeGreaterThan(0);
    },
    10000
  );

  it(
    "has combo_meals table",
    async () => {
      const result = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'combo_meals')::boolean as exists"
      );
      expect(result.rows[0].exists).toBe(true);
    },
    10000
  );

  it(
    "menu items have valid prices (> 0)",
    async () => {
      const result = await pool.query(
        "SELECT COUNT(*)::int as count FROM menu_items WHERE price <= 0"
      );
      expect(result.rows[0].count).toBe(0);
    },
    10000
  );

  it(
    "all categories have at least one item",
    async () => {
      const result = await pool.query(`
        SELECT c.name, COUNT(mi.id)::int as item_count
        FROM categories c
        LEFT JOIN menu_items mi ON mi.category_id = c.id AND mi.available = true
        GROUP BY c.id, c.name
        HAVING COUNT(mi.id) = 0
      `);
      expect(result.rows.length).toBe(0);
    },
    10000
  );
});
