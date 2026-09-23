import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { rawRows, type Database } from "../../src/client";
import * as schema from "../../src/schema";

const migrationsDir = join(__dirname, "..", "..", "migrations");

/**
 * Supabase provides the `auth` schema, the `authenticated` role and `auth.uid()`.
 * PGlite is vanilla Postgres, so the migrations need this minimal shim first.
 */
const AUTH_SHIM = `
  create schema if not exists auth;
  create table if not exists auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
  );
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
      create role authenticated nologin;
    end if;
  end $$;
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
`;

function migrationStatements(): string[] {
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .flatMap((f) =>
      readFileSync(join(migrationsDir, f), "utf8")
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean),
    );
}

export interface TestDatabase {
  db: Database;
  client: PGlite;
  /** Inserts an auth user (fires the profile trigger) and returns its id. */
  createUser(email?: string): Promise<string>;
  close(): Promise<void>;
}

/** Fresh in-memory Postgres with every migration applied, exactly as production would. */
export async function createTestDatabase(): Promise<TestDatabase> {
  const client = new PGlite();
  await client.exec(AUTH_SHIM);
  for (const statement of migrationStatements()) {
    await client.exec(statement);
  }
  const db = drizzle(client, { schema }) as unknown as Database;

  let counter = 0;
  return {
    db,
    client,
    async createUser(email?: string) {
      counter += 1;
      const rows = await rawRows<{ id: string }>(
        db,
        sql`insert into auth.users (id, email, raw_user_meta_data)
            values (gen_random_uuid(), ${email ?? `user${counter}@test.local`}, '{"locale":"en"}'::jsonb)
            returning id`,
      );
      const id = rows[0]?.id;
      if (!id) throw new Error("failed to create auth user");
      return id;
    },
    close: () => client.close(),
  };
}
