import { AppError, isAppError } from "@bawsala/core";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth";

export type ApiContext<TParams = Record<string, string>> = {
  request: Request;
  params: TParams;
  user: User;
};

type RouteContext<TParams> = { params: Promise<TParams> };

/** `{ data, meta? }` success envelope. */
export function ok<T>(data: T, init?: { status?: number; meta?: Record<string, unknown> }) {
  return NextResponse.json(init?.meta ? { data, meta: init.meta } : { data }, {
    status: init?.status ?? 200,
  });
}

export function toErrorResponse(error: unknown): NextResponse {
  if (isAppError(error)) return NextResponse.json(error.toJSON(), { status: error.status });
  if (error instanceof z.ZodError) {
    const appError = new AppError("VALIDATION_FAILED", "Validation failed", z.treeifyError(error));
    return NextResponse.json(appError.toJSON(), { status: appError.status });
  }
  console.error("[api] unhandled error", error);
  return NextResponse.json(new AppError("INTERNAL").toJSON(), { status: 500 });
}

/**
 * Wraps a route handler with authentication and uniform error mapping.
 * Use `publicRoute` for endpoints that must not require a session.
 */
export function authedRoute<TParams = Record<string, string>>(
  handler: (ctx: ApiContext<TParams>) => Promise<Response>,
) {
  return async (request: Request, context: RouteContext<TParams>): Promise<Response> => {
    try {
      const user = await requireApiUser(request);
      const params = await context.params;
      return await handler({ request, params, user });
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export function publicRoute<TParams = Record<string, string>>(
  handler: (ctx: Omit<ApiContext<TParams>, "user">) => Promise<Response>,
) {
  return async (request: Request, context: RouteContext<TParams>): Promise<Response> => {
    try {
      const params = await context.params;
      return await handler({ request, params });
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

/** Parses and validates a JSON body; throws a ZodError / AppError on failure. */
export async function parseJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.output<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("VALIDATION_FAILED", "Body must be valid JSON");
  }
  return schema.parse(body);
}

export function parseQuery<T extends z.ZodType>(request: Request, schema: T): z.output<T> {
  const url = new URL(request.url);
  return schema.parse(Object.fromEntries(url.searchParams.entries()));
}
