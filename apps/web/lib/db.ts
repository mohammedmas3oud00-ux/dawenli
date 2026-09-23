import { createDb, ensureEmbeddedDbReady, getEmbeddedDb, type Database } from "@bawsala/db";
import { serverEnv } from "@/lib/env";

declare global {
  var __bawsalaDb: Database | undefined;
}

export function isDemoMode(): boolean {
  return (
    process.env.DEMO_MODE === "true" ||
    !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes("54322") ||
    process.env.DATABASE_URL.includes("<project-ref>")
  );
}

/**
 * Process-wide Drizzle client. In Demo Mode (or without an external PostgreSQL server),
 * uses the embedded PGlite instance pre-populated with realistic demo data.
 */
export function db(): Database {
  if (!globalThis.__bawsalaDb) {
    if (isDemoMode()) {
      globalThis.__bawsalaDb = getEmbeddedDb();
    } else {
      globalThis.__bawsalaDb = createDb(serverEnv().DATABASE_URL);
    }
  }
  return globalThis.__bawsalaDb;
}

export async function ensureDbReady(): Promise<Database> {
  const current = db();
  if (isDemoMode()) {
    await ensureEmbeddedDbReady();
  }
  return current;
}

