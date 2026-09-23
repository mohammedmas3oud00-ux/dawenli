import ar from "../messages/ar.json";
import en from "../messages/en.json";
import { directionFor, isLocale, LOCALES } from "../src";

function flatten(obj: Record<string, unknown>, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, value);
    else if (value && typeof value === "object")
      for (const [k, v] of flatten(value as Record<string, unknown>, path)) out.set(k, v);
  }
  return out;
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("message catalogs", () => {
  const enFlat = flatten(en);
  const arFlat = flatten(ar);

  it("have identical key sets", () => {
    expect([...arFlat.keys()].sort()).toEqual([...enFlat.keys()].sort());
  });

  it("have no empty strings", () => {
    for (const [key, value] of [...enFlat, ...arFlat]) expect(value.trim(), key).not.toBe("");
  });

  it("use the same ICU placeholders in both languages", () => {
    for (const [key, value] of enFlat) {
      expect(placeholders(arFlat.get(key) ?? ""), key).toEqual(placeholders(value));
    }
  });

  it("cover every AppError code", () => {
    for (const code of [
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "VALIDATION_FAILED",
      "CONFLICT",
      "RATE_LIMITED",
      "INTERNAL",
    ]) {
      expect(enFlat.has(`errors.${code}`), code).toBe(true);
    }
  });
});

describe("helpers", () => {
  it("recognises supported locales", () => {
    for (const l of LOCALES) expect(isLocale(l)).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("marks Arabic as RTL", () => {
    expect(directionFor("ar")).toBe("rtl");
    expect(directionFor("en")).toBe("ltr");
  });
});
