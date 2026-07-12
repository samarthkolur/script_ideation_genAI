/** New brief version for an existing project (edit constraints -> regenerate), not a new project. */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { toErrorResponse } from "@/lib/api-helpers";
import { briefInputSchema } from "@/lib/validations/brief";
import { generateVariants } from "@/lib/ai-service-client";
import { toBriefPayload, fromVariantPayload } from "@/lib/mappers";

export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/briefs">) {
  try {
    const { organizationId } = await requireSession();
    const { id: projectId } = await ctx.params;
    const body = briefInputSchema.parse(await request.json());

    const project = await db.project.findFirst({
      where: { id: projectId, organizationId },
      include: { briefs: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const nextVersion = (project.briefs[0]?.version ?? 0) + 1;
    const brief = await db.brief.create({
      data: {
        projectId,
        version: nextVersion,
        genres: body.genres,
        audience: body.audience,
        budgetTier: body.budgetTier,
        runtimeMinutes: body.runtimeMinutes,
        region: body.region,
        language: body.language,
        censorshipFramework: body.censorshipFramework,
        censorshipRating: body.censorshipRating,
        locationType: body.locationType,
        castSize: body.castSize,
        vfxDependency: body.vfxDependency,
        freeformNotes: body.freeformNotes,
      },
    });

    const run = await db.generationRun.create({
      data: { briefId: brief.id, model: "pending", status: "generating" },
    });

    try {
      const result = await generateVariants(toBriefPayload(brief));
      await db.$transaction([
        db.generationRun.update({
          where: { id: run.id },
          data: { model: result.model, status: "complete", completedAt: new Date() },
        }),
        ...result.variants.map((v, index) =>
          db.variant.create({ data: { generationRunId: run.id, index, ...fromVariantPayload(v) } })
        ),
      ]);
    } catch (genError) {
      await db.generationRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          errorMessage: genError instanceof Error ? genError.message : String(genError),
        },
      });
    }

    const fullBrief = await db.brief.findUniqueOrThrow({
      where: { id: brief.id },
      include: { generationRuns: { include: { variants: true } } },
    });
    return NextResponse.json(fullBrief, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
