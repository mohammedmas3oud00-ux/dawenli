import { afterEach, describe, expect, it, vi } from "vitest";
import { isLocalDemoMode } from "./env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isLocalDemoMode", () => {
  it("never enables the demo authentication bypass in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(isLocalDemoMode()).toBe(false);
  });

  it("enables the embedded demo during local development when explicitly requested", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEMO_MODE", "true");

    expect(isLocalDemoMode()).toBe(true);
  });
});
