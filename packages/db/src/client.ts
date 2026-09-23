import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

/** Cheapest possible round-trip; used by health checks and keep-alive pings. */
export async function pingDatabase(db: Database): Promise<void> {
  await db.execute(sql`select 1`);
}

/**
 * Creates a Drizzle client over postgres-js.
 * Use the Supabase *transaction pooler* URL (port 6543) in serverless
 * environments and disable prepared statements, which pgBouncer in
 * transaction mode does not support.
 */
export function createDb(connectionString: string) {
  const client = postgres(connectionString, { prepare: false, max: 1 });
  return drizzle(client, { schema });
}
