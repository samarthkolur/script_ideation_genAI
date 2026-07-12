/** v1 polling endpoint (design.md §8: streaming is a staged v1.1 fast-follow, not built yet). */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { toErrorResponse } from "@/lib/api-helpers";

export async function GET(_request: Request, ctx: RouteContext<"/api/generation-runs/[id]">) {
  try {
    const { organizationId } = await requireSession();
    const { id } = await ctx.params;
    const run = await db.generationRun.findFirst({
      where: { id, brief: { project: { organizationId } } },
      include: { variants: true },
    });
    if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(run);
  } catch (error) {
    return toErrorResponse(error);
  }
}
