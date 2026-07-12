import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { toErrorResponse } from "@/lib/api-helpers";
import { exportVariantSchema } from "@/lib/validations/brief";
import { findOrgScopedVariant } from "@/lib/variants";
import { renderVariantAsPdf, renderVariantAsText } from "@/lib/export";

export async function POST(request: Request, ctx: RouteContext<"/api/variants/[id]/export">) {
  try {
    const { organizationId } = await requireSession();
    const { id } = await ctx.params;
    const { format } = exportVariantSchema.parse(await request.json());

    const variant = await findOrgScopedVariant(id, organizationId);
    if (!variant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const title = variant.generationRun.brief.project.title;
    const filenameBase = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) || "variant";

    if (format === "pdf") {
      const bytes = await renderVariantAsPdf(variant, title);
      return new NextResponse(new Blob([new Uint8Array(bytes)]), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`,
        },
      });
    }
    const text = renderVariantAsText(variant, title);
    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameBase}.txt"`,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
