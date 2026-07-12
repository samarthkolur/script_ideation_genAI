import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { toErrorResponse } from "@/lib/api-helpers";
import { findOrgScopedVariant } from "@/lib/variants";

export async function GET(_request: Request, ctx: RouteContext<"/api/variants/[id]">) {
  try {
    const { organizationId } = await requireSession();
    const { id } = await ctx.params;
    const variant = await findOrgScopedVariant(id, organizationId);
    if (!variant) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(variant);
  } catch (error) {
    return toErrorResponse(error);
  }
}
