import { createDb, type Database } from "@bawsala/db";
import { serverEnv } from "@/lib/env";

declare global {
  var __bawsalaDb: Database | undefined;
}

/**
 * Process-wide Drizzle client. Cached on `globalThis` so hot reloads in dev
 * don't leak connections; serverless instances create one pooled connection each.
 */
export function db(): Database {
  if (!globalThis.__bawsalaDb) {
    globalThis.__bawsalaDb = createDb(serverEnv().DATABASE_URL);
  }
  return globalThis.__bawsalaDb;
}
