import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, ".env.local") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
