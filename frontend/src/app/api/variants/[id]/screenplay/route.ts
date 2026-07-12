/** On-demand professional screenplay excerpt for a chosen variant — kept
 * separate from generate/refine (design.md's screenplay-ideation
 * redesign) so the "generate 3-5 variants" step stays fast; the heavier
 * multi-scene, industry-formatted script pages are only produced when a
 * writer explicitly asks for them on one variant. Persists onto the same
 * Variant row (not a new row — unlike refine, this doesn't change the
 * story, just adds a rendering of its opening). */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { toErrorResponse } from "@/lib/api-helpers";
import { generateScreenplaySchema } from "@/lib/validations/brief";
import { findOrgScopedVariant } from "@/lib/variants";
import { generateScreenplay } from "@/lib/ai-service-client";
import { toBriefPayload, toVariantPayload } from "@/lib/mappers";

export async function POST(request: Request, ctx: RouteContext<"/api/variants/[id]/screenplay">) {
  try {
    const { organizationId } = await requireSession();
    const { id } = await ctx.params;
    const { sceneTarget, provider } = generateScreenplaySchema.parse(await request.json().catch(() => ({})));

    const variant = await findOrgScopedVariant(id, organizationId);
    if (!variant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const brief = variant.generationRun.brief;
    const result = await generateScreenplay(toBriefPayload(brief), toVariantPayload(variant), sceneTarget, provider);

    const updated = await db.variant.update({
      where: { id: variant.id },
      data: { screenplayExcerpt: result.screenplay_excerpt },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
