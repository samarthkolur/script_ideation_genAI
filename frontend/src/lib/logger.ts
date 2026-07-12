/**
 * Structured server-side logging (design.md sub-milestone 2.5) — a single
 * Pino instance, mirroring the singleton pattern already used for the
 * Prisma client (`lib/db.ts`). Pretty-printed in development (readable in
 * a terminal), plain JSON in production (the format log aggregators
 * actually want). Server-only: never imported by client components, since
 * Pino's Node APIs don't exist in the browser.
 */

import "server-only";
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" } }
      : undefined,
});
