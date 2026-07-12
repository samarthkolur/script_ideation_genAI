import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { toErrorResponse } from "@/lib/api-helpers";
import { createProjectSchema } from "@/lib/validations/brief";
import { generateVariants } from "@/lib/ai-service-client";
import { toBriefPayload, fromVariantPayload } from "@/lib/mappers";

export async function GET() {
  try {
    const { organizationId } = await requireSession();
    const projects = await db.project.findMany({
      where: { organizationId, archivedAt: null },
      orderBy: { updatedAt: "desc" },
      include: {
        briefs: {
          orderBy: { version: "desc" },
          take: 1,
          include: { generationRuns: { orderBy: { startedAt: "desc" }, take: 1, include: { variants: true } } },
        },
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, organizationId } = await requireSession();
    const body = createProjectSchema.parse(await request.json());

    const project = await db.project.create({
      data: {
        organizationId,
        title: body.title,
        createdById: user.id,
        briefs: {
          create: {
            version: 1,
            genres: body.brief.genres,
            audience: body.brief.audience,
            budgetTier: body.brief.budgetTier,
            runtimeMinutes: body.brief.runtimeMinutes,
            region: body.brief.region,
            language: body.brief.language,
            censorshipFramework: body.brief.censorshipFramework,
            censorshipRating: body.brief.censorshipRating,
            locationType: body.brief.locationType,
            castSize: body.brief.castSize,
            vfxDependency: body.brief.vfxDependency,
            freeformNotes: body.brief.freeformNotes,
          },
        },
      },
      include: { briefs: true },
    });
    const brief = project.briefs[0];

    const run = await db.generationRun.create({
      data: { briefId: brief.id, model: "pending", status: "generating" },
    });

    try {
      const result = await generateVariants(toBriefPayload(brief), 3, body.brief.provider);
      await db.$transaction([
        db.generationRun.update({
          where: { id: run.id },
          data: { model: result.model, status: "complete", completedAt: new Date() },
        }),
        ...result.variants.map((v, index) =>
          db.variant.create({
            data: { generationRunId: run.id, index, ...fromVariantPayload(v) },
          })
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

    const full = await db.project.findUniqueOrThrow({
      where: { id: project.id },
      include: { briefs: { include: { generationRuns: { include: { variants: true } } } } },
    });
    return NextResponse.json(full, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
