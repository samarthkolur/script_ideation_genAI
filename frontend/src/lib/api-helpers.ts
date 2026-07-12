import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/lib/session";
import { logger } from "@/lib/logger";

/** Maps the errors every Route Handler can throw to the right HTTP status — one place, not repeated per route. */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
  }
  logger.error({ err: error }, "Unhandled route error");
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
