/**
 * Replaces the Phase 1 hardcoded frontend/src/lib/constraint-taxonomy.ts —
 * serves CT-01..CT-08 from Postgres (ConstraintOption, seeded from
 * docs/constraint-taxonomy-v1.md via prisma/seed.ts). Satisfies source-plan
 * NFR-08 (constraint config updatable without code changes). Public — no
 * session required, since the brief form needs it before a user necessarily
 * has a project yet.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toErrorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const options = await db.constraintOption.findMany({
      where: { isActive: true },
      orderBy: [{ dimension: "asc" }, { sortOrder: "asc" }],
    });
    const byDimension: Record<string, typeof options> = {};
    for (const option of options) {
      (byDimension[option.dimension] ??= []).push(option);
    }
    return NextResponse.json(byDimension);
  } catch (error) {
    return toErrorResponse(error);
  }
}
