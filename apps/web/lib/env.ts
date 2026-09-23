import { z } from "zod";

/**
 * Environment access is lazy so `next build` succeeds without secrets;
 * misconfiguration surfaces as a clear error on the first request instead.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
});

function formatIssues(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

let publicCache: z.infer<typeof publicSchema> | undefined;
let serverCache: z.infer<typeof serverSchema> | undefined;

export function publicEnv() {
  if (publicCache) return publicCache;
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) throw new Error(`Invalid public env: ${formatIssues(parsed.error)}`);
  publicCache = parsed.data;
  return publicCache;
}

export function serverEnv() {
  if (serverCache) return serverCache;
  const parsed = serverSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
  });
  if (!parsed.success) throw new Error(`Invalid server env: ${formatIssues(parsed.error)}`);
  serverCache = parsed.data;
  return serverCache;
}

/** True when the public Supabase variables are present (used by health checks). */
export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasDatabaseEnv(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
