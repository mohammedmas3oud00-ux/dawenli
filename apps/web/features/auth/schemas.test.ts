import { authErrorKey, loginSchema, registerSchema, safeNextPath } from "./schemas";

describe("safeNextPath", () => {
  it("accepts same-origin relative paths", () => {
    expect(safeNextPath("/settings", "/today")).toBe("/settings");
    expect(safeNextPath("/ar/goals?x=1", "/today")).toBe("/ar/goals?x=1");
  });

  it("rejects open-redirect attempts", () => {
    expect(safeNextPath("https://evil.example", "/today")).toBe("/today");
    expect(safeNextPath("//evil.example", "/today")).toBe("/today");
    expect(safeNextPath("/\\evil.example", "/today")).toBe("/today");
    expect(safeNextPath(null, "/today")).toBe("/today");
    expect(safeNextPath("", "/today")).toBe("/today");
  });
});

describe("auth schemas", () => {
  it("normalises email and enforces password length", () => {
    const parsed = loginSchema.parse({ email: "  Someone@Example.COM ", password: "12345678" });
    expect(parsed.email).toBe("someone@example.com");
    expect(loginSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(false);
  });

  it("requires a display name on registration", () => {
    expect(
      registerSchema.safeParse({ email: "a@b.co", password: "12345678", displayName: " " }).success,
    ).toBe(false);
  });
});

describe("authErrorKey", () => {
  it("maps known Supabase codes and falls back to generic", () => {
    expect(authErrorKey("invalid_credentials")).toBe("invalidCredentials");
    expect(authErrorKey("email_not_confirmed")).toBe("emailNotConfirmed");
    expect(authErrorKey("user_already_exists")).toBe("userExists");
    expect(authErrorKey("weak_password")).toBe("weakPassword");
    expect(authErrorKey(undefined)).toBe("generic");
    expect(authErrorKey("something_else")).toBe("generic");
  });
});
