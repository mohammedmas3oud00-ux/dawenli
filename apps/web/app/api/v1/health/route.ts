import { pingDatabase } from "@bawsala/db";
import { db } from "@/lib/db";
import { hasDatabaseEnv } from "@/lib/env";
import { ok, publicRoute } from "@/lib/api/handler";

export const dynamic = "force-dynamic";

/**
 * Liveness + optional database ping.
 * The DB round-trip runs when `Authorization: Bearer <CRON_SECRET>` matches —
 * this is what the daily GitLab keep-alive pipeline calls to prevent Supabase
 * from pausing the free project (docs/deployment.md §2.4).
 */
export const GET = publicRoute(async ({ request }) => {
  const startedAt = Date.now();
  const secret = process.env.CRON_SECRET;
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const deep = Boolean(secret && token && token === secret);

  let database: "ok" | "error" | "skipped" = "skipped";
  if (deep && hasDatabaseEnv()) {
    try {
      await pingDatabase(db());
      database = "ok";
    } catch (error) {
      console.error("[health] database ping failed", error);
      database = "error";
    }
  }

  return ok(
    {
      status: database === "error" ? "degraded" : "ok",
      time: new Date().toISOString(),
      database,
      latencyMs: Date.now() - startedAt,
    },
    { status: database === "error" ? 503 : 200 },
  );
});
