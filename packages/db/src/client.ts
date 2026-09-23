import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

/**
 * Creates a Drizzle client over postgres-js.
 * Use the Supabase *transaction pooler* URL (port 6543) in serverless
 * environments and disable prepared statements, which pgBouncer in
 * transaction mode does not support.
 */
export function createDb(connectionString: string) {
  const sql = postgres(connectionString, { prepare: false, max: 1 });
  return drizzle(sql, { schema });
}
