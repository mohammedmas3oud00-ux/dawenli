import { sql } from "drizzle-orm";
import { rawRows } from "../src/client";
import { createTestDatabase, type TestDatabase } from "./helpers/pglite";

let t: TestDatabase;

beforeAll(async () => {
  t = await createTestDatabase();
});
afterAll(() => t.close());

describe("migrations on a real Postgres (PGlite)", () => {
  it("apply cleanly and create every public table", async () => {
    const rows = await rawRows<{ table_name: string }>(
      t.db,
      sql`select table_name from information_schema.tables where table_schema = 'public' order by 1`,
    );
    const names = rows.map((r) => r.table_name);
    expect(names).toEqual(expect.arrayContaining(["profiles", "tasks", "goals", "habits", "reviews"]));
  });

  it("bootstrap a profile when an auth user is created", async () => {
    const id = await t.createUser("trigger@test.local");
    const rows = await rawRows<{ locale: string }>(
      t.db,
      sql`select locale from public.profiles where id = ${id}::uuid`,
    );
    expect(rows[0]?.locale).toBe("en");
  });

  it("maintain updated_at via trigger", async () => {
    const id = await t.createUser();
    const before = await rawRows<{ updated_at: string }>(
      t.db,
      sql`select updated_at from public.profiles where id = ${id}::uuid`,
    );
    await t.db.execute(sql`select pg_sleep(0.01)`);
    await t.db.execute(sql`update public.profiles set display_name = 'x' where id = ${id}::uuid`);
    const after = await rawRows<{ updated_at: string }>(
      t.db,
      sql`select updated_at from public.profiles where id = ${id}::uuid`,
    );
    expect(new Date(after[0]!.updated_at).getTime()).toBeGreaterThan(
      new Date(before[0]!.updated_at).getTime(),
    );
  });
});
