/** FR-05 — targeted refinement. Creates a new Variant (not a mutation of
 * the original) plus a Refinement record linking parent -> result, so the
 * refinement history is preserved (AC-04's "structural core preserved" is
 * a prompt-level guarantee, not something enforced here — but keeping both
 * versions means a user can always see what changed). */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { toErrorResponse } from "@/lib/api-helpers";
import { refineVariantSchema } from "@/lib/validations/brief";
import { findOrgScopedVariant } from "@/lib/variants";
import { refineVariant } from "@/lib/ai-service-client";
import { toBriefPayload, toVariantPayload, fromVariantPayload } from "@/lib/mappers";

export async function POST(request: Request, ctx: RouteContext<"/api/variants/[id]/refine">) {
  try {
    const { organizationId } = await requireSession();
    const { id } = await ctx.params;
    const { instruction } = refineVariantSchema.parse(await request.json());

    const parent = await findOrgScopedVariant(id, organizationId);
    if (!parent) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const brief = parent.generationRun.brief;
    const result = await refineVariant(toBriefPayload(brief), toVariantPayload(parent), instruction);

    const created = await db.$transaction(async (tx) => {
      const resultVariant = await tx.variant.create({
        data: {
          generationRunId: parent.generationRunId,
          index: parent.index,
          ...fromVariantPayload(result.variant),
        },
      });
      await tx.refinement.create({
        data: { parentVariantId: parent.id, instruction, resultVariantId: resultVariant.id },
      });
      return resultVariant;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
