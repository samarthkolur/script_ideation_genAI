import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { toErrorResponse } from "@/lib/api-helpers";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  archived: z.boolean().optional(),
});

export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  try {
    const { organizationId } = await requireSession();
    const { id } = await ctx.params;
    const project = await db.project.findFirst({
      where: { id, organizationId },
      include: {
        briefs: {
          orderBy: { version: "desc" },
          include: { generationRuns: { orderBy: { startedAt: "desc" }, include: { variants: true } } },
        },
      },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(project);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  try {
    const { organizationId } = await requireSession();
    const { id } = await ctx.params;
    const body = patchSchema.parse(await request.json());

    const existing = await db.project.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const project = await db.project.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.archived !== undefined ? { archivedAt: body.archived ? new Date() : null } : {}),
      },
    });
    return NextResponse.json(project);
  } catch (error) {
    return toErrorResponse(error);
  }
}
