import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:54322/postgres",
  },
  // Supabase manages the auth schema; never let drizzle-kit touch it.
  schemaFilter: ["public"],
  entities: {
    roles: { provider: "supabase" },
  },
  strict: true,
  verbose: true,
});
