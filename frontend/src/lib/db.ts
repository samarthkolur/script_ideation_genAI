/**
 * Prisma client singleton — the only way any server-side code in this app
 * touches Postgres. Never imported from a "use client" component; Postgres
 * is reached exclusively through Route Handlers per the BFF architecture
 * (design.md DD-007).
 *
 * Why a singleton: Next.js dev mode hot-reloads modules on every file save,
 * which would otherwise create a new PrismaClient (and a new connection
 * pool) per reload. Caching it on `globalThis` in development avoids
 * exhausting the Postgres connection limit.
 *
 * Why an explicit `adapter`: Prisma 7 removed schema-level `datasource url`
 * (see prisma/schema.prisma) in favor of passing a driver adapter to the
 * client constructor — this is the pg (node-postgres) adapter, which works
 * against any standard Postgres connection string (Neon, Supabase, RDS, ...).
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy frontend/.env.example to frontend/.env and set your Postgres connection string."
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
