import { sql, type ExtractTablesWithRelations, type SQL } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Driver-agnostic Drizzle handle. Production uses postgres-js (see `createDb`);
 * integration tests run the very same services and migrations on PGlite.
 */
export type Database = PgDatabase<
  PgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/** Cheapest possible round-trip; used by health checks and keep-alive pings. */
export async function pingDatabase(db: Database): Promise<void> {
  await db.execute(sql`select 1`);
}

/**
 * Runs a raw query and returns its rows regardless of driver:
 * postgres-js resolves to an array-like RowList, PGlite to `{ rows }`.
 */
export async function rawRows<T extends Record<string, unknown>>(
  db: Database,
  query: SQL,
): Promise<T[]> {
  const result = (await db.execute(query)) as unknown;
  if (Array.isArray(result)) return result as T[];
  const rows = (result as { rows?: unknown }).rows;
  return Array.isArray(rows) ? (rows as T[]) : [];
}

/**
 * Creates a Drizzle client over postgres-js.
 * Use the Supabase *transaction pooler* URL (port 6543) in serverless
 * environments and disable prepared statements, which pgBouncer in
 * transaction mode does not support.
 */
export function createDb(connectionString: string): Database {
  const client = postgres(connectionString, { prepare: false, max: 1 });
  return drizzle(client, { schema });
}
