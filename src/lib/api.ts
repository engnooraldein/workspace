import { NextResponse } from "next/server";

export function json<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function fail(error: string, status = 400, fields?: Record<string, string>): NextResponse {
  return NextResponse.json(fields ? { error, fields } : { error }, { status });
}

/** Wraps a route handler so unexpected errors always return JSON, never HTML. */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
      if (message === "UNAUTHORIZED") return fail("UNAUTHORIZED", 401);
      if (message === "FORBIDDEN") return fail("FORBIDDEN", 403);
      console.error("[api] unhandled error:", error);
      return fail("INTERNAL_ERROR", 500);
    }
  };
}
