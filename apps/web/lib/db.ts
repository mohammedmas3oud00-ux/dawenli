import { createDb, ensureEmbeddedDbReady, getEmbeddedDb, type Database } from "@bawsala/db";
import { isLocalDemoMode, serverEnv } from "@/lib/env";

declare global {
  var __bawsalaDb: Database | undefined;
  var __bawsalaDbMode: "demo" | "external" | undefined;
}

export function isDemoMode(): boolean {
  return isLocalDemoMode();
}

/**
 * Process-wide Drizzle client. In Demo Mode (or without an external PostgreSQL server),
 * uses the embedded PGlite instance pre-populated with realistic demo data.
 */
export function db(): Database {
  const mode = isDemoMode() ? "demo" : "external";
  if (!globalThis.__bawsalaDb || globalThis.__bawsalaDbMode !== mode) {
    if (mode === "demo") {
      globalThis.__bawsalaDb = getEmbeddedDb();
    } else {
      globalThis.__bawsalaDb = createDb(serverEnv().DATABASE_URL);
    }
    globalThis.__bawsalaDbMode = mode;
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
