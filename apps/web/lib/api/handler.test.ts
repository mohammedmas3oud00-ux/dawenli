import { AppError } from "@bawsala/core";
import { z } from "zod";
import { ok, parseJson, parseQuery, publicRoute, toErrorResponse } from "./handler";

const ctx = { params: Promise.resolve({}) };

describe("ok", () => {
  it("wraps data in the envelope", async () => {
    const res = ok({ a: 1 }, { meta: { total: 1 } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { a: 1 }, meta: { total: 1 } });
  });
});

describe("toErrorResponse", () => {
  it("maps AppError to its status and envelope", async () => {
    const res = toErrorResponse(new AppError("NOT_FOUND", "nope"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: { code: "NOT_FOUND", message: "nope" } });
  });

  it("maps ZodError to 422 with details", async () => {
    const result = z.object({ x: z.number() }).safeParse({ x: "no" });
    const res = toErrorResponse(result.error);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.details).toBeDefined();
  });

  it("hides unknown errors behind INTERNAL", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = toErrorResponse(new Error("secret db string"));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
    spy.mockRestore();
  });
});

describe("publicRoute", () => {
  it("passes params through and converts thrown errors", async () => {
    const handler = publicRoute<{ id: string }>(async ({ params }) => {
      if (params.id === "missing") throw new AppError("NOT_FOUND");
      return ok({ id: params.id });
    });

    const good = await handler(new Request("http://x/a"), {
      params: Promise.resolve({ id: "42" }),
    });
    expect(await good.json()).toEqual({ data: { id: "42" } });

    const bad = await handler(new Request("http://x/a"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(bad.status).toBe(404);
  });
});

describe("parseJson / parseQuery", () => {
  const schema = z.object({ n: z.coerce.number() });

  it("rejects invalid JSON bodies with VALIDATION_FAILED", async () => {
    const req = new Request("http://x", { method: "POST", body: "{not json" });
    await expect(parseJson(req, schema)).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("parses valid bodies and query strings", async () => {
    const req = new Request("http://x", { method: "POST", body: JSON.stringify({ n: 3 }) });
    expect(await parseJson(req, schema)).toEqual({ n: 3 });
    expect(parseQuery(new Request("http://x?n=7"), schema)).toEqual({ n: 7 });
  });

  void ctx;
});
