/**
 * FR-08 export rendering. Generates on-demand and streams directly to the
 * browser rather than persisting to blob storage — there's no object
 * storage (S3/R2/etc.) provisioned yet, and standing that up is a
 * deferred, separate task, not something to half-implement here. The
 * Prisma `Export` model exists (schema-ready) for when it is.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface ExportableVariant {
  logline: string;
  threeActOutline: unknown;
  characterArchetypes: string[];
  centralConflict: string;
  productionComplexity: string;
  estimatedLocations: number;
  estimatedPrincipalCast: number;
  vfxLevelUsed: string;
}

function outline(v: ExportableVariant): { act1: string; act2: string; act3: string } {
  return v.threeActOutline as { act1: string; act2: string; act3: string };
}

export function renderVariantAsText(v: ExportableVariant, title: string): string {
  const o = outline(v);
  return [
    title,
    "=".repeat(title.length),
    "",
    "AI-GENERATED FICTION — not based on real people or events.",
    "",
    "LOGLINE",
    v.logline,
    "",
    "ACT I",
    o.act1,
    "",
    "ACT II",
    o.act2,
    "",
    "ACT III",
    o.act3,
    "",
    "CENTRAL CONFLICT",
    v.centralConflict,
    "",
    "CHARACTER ARCHETYPES",
    ...v.characterArchetypes.map((a) => `- ${a}`),
    "",
    `Production complexity: ${v.productionComplexity} | Locations: ${v.estimatedLocations} | Principal cast: ${v.estimatedPrincipalCast} | VFX: ${v.vfxLevelUsed}`,
  ].join("\n");
}

export async function renderVariantAsPdf(v: ExportableVariant, title: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]); // A4
  const margin = 50;
  let y = 792;
  const lineHeight = 16;
  const maxWidth = 495;

  function wrap(text: string, size: number, useFont = font): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (useFont.widthOfTextAtSize(candidate, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function ensureSpace(needed: number) {
    if (y - needed < margin) {
      page = doc.addPage([595, 842]);
      y = 792;
    }
  }

  function heading(text: string) {
    ensureSpace(lineHeight * 2);
    page.drawText(text, { x: margin, y, size: 13, font: bold, color: rgb(0.2, 0.15, 0.5) });
    y -= lineHeight * 1.5;
  }

  function paragraph(text: string) {
    for (const line of wrap(text, 10)) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
      y -= lineHeight;
    }
    y -= lineHeight * 0.5;
  }

  page.drawText(title, { x: margin, y, size: 18, font: bold });
  y -= lineHeight * 2;
  page.drawText("AI-generated fiction — not based on real people or events.", {
    x: margin,
    y,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= lineHeight * 2;

  const o = outline(v);
  heading("Logline");
  paragraph(v.logline);
  heading("Act I");
  paragraph(o.act1);
  heading("Act II");
  paragraph(o.act2);
  heading("Act III");
  paragraph(o.act3);
  heading("Central Conflict");
  paragraph(v.centralConflict);
  heading("Character Archetypes");
  paragraph(v.characterArchetypes.join(", "));
  heading("Production Summary");
  paragraph(
    `Complexity: ${v.productionComplexity} | Locations: ${v.estimatedLocations} | Principal cast: ${v.estimatedPrincipalCast} | VFX: ${v.vfxLevelUsed}`
  );

  return doc.save();
}
