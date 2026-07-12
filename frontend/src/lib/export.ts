/**
 * FR-08 export rendering. Generates on-demand and streams directly to the
 * browser rather than persisting to blob storage — there's no object
 * storage (S3/R2/etc.) provisioned yet, and standing that up is a
 * deferred, separate task, not something to half-implement here. The
 * Prisma `Export` model exists (schema-ready) for when it is.
 *
 * Walks all 18 sections of the rich screenplay-ideation `VariantOutput`
 * shape (design.md) plus the on-demand screenplay excerpt when present.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type {
  ActOne,
  ActThree,
  ActTwo,
  MainCharacter,
  ProductionConsiderations,
} from "@/lib/types";

interface ExportableVariant {
  workingTitle: string;
  genre: string;
  tone: string;
  targetAudience: string;
  logline: string;
  highConcept: string;
  theme: string;
  emotionalCore: string;
  worldBuilding: string;
  mainCharacters: unknown;
  threeActStructure: unknown;
  majorPlotTwists: string[];
  characterRelationships: string[];
  visualStyle: string;
  cinematicReferences: string[];
  productionConsiderations: unknown;
  constraintValidation: unknown;
  uniquenessNote: string;
  centralConflict: string;
  productionComplexity: string;
  estimatedLocations: number;
  estimatedPrincipalCast: number;
  vfxLevelUsed: string;
  screenplayExcerpt: string | null;
}

function characters(v: ExportableVariant): MainCharacter[] {
  return v.mainCharacters as MainCharacter[];
}

function acts(v: ExportableVariant): { act1: ActOne; act2: ActTwo; act3: ActThree } {
  return v.threeActStructure as { act1: ActOne; act2: ActTwo; act3: ActThree };
}

function production(v: ExportableVariant): ProductionConsiderations {
  return v.productionConsiderations as ProductionConsiderations;
}

function constraints(v: ExportableVariant): Record<string, string> {
  return v.constraintValidation as Record<string, string>;
}

export function renderVariantAsText(v: ExportableVariant, title: string): string {
  const { act1, act2, act3 } = acts(v);
  const prod = production(v);
  const lines: string[] = [
    title,
    "=".repeat(title.length),
    "",
    "AI-GENERATED FICTION — not based on real people or events.",
    "",
    `WORKING TITLE: ${v.workingTitle}`,
    `GENRE: ${v.genre}    TONE: ${v.tone}    AUDIENCE: ${v.targetAudience}`,
    "",
    "LOGLINE",
    v.logline,
    "",
    "HIGH CONCEPT",
    v.highConcept,
    "",
    "THEME",
    v.theme,
    "",
    "EMOTIONAL CORE",
    v.emotionalCore,
    "",
    "WORLD BUILDING",
    v.worldBuilding,
    "",
    "MAIN CHARACTERS",
    ...characters(v).flatMap((c) => [
      `- ${c.name} (${c.age})`,
      `  Motivation: ${c.motivation}`,
      `  Internal conflict: ${c.internalConflict}`,
      `  External conflict: ${c.externalConflict}`,
      `  Arc: ${c.arc}`,
    ]),
    "",
    "THREE-ACT STRUCTURE",
    "Act I",
    `  Opening image: ${act1.openingImage}`,
    `  Inciting incident: ${act1.incitingIncident}`,
    `  First turning point: ${act1.firstTurningPoint}`,
    "Act II",
    `  Rising conflict: ${act2.risingConflict}`,
    `  Midpoint: ${act2.midpoint}`,
    `  Complications: ${act2.complications}`,
    `  Lowest point: ${act2.lowestPoint}`,
    "Act III",
    `  Climax: ${act3.climax}`,
    `  Resolution: ${act3.resolution}`,
    `  Final image: ${act3.finalImage}`,
    "",
    "MAJOR PLOT TWISTS",
    ...v.majorPlotTwists.map((t) => `- ${t}`),
    "",
    "CHARACTER RELATIONSHIPS",
    ...v.characterRelationships.map((r) => `- ${r}`),
    "",
    "VISUAL STYLE",
    v.visualStyle,
    "",
    "CINEMATIC REFERENCES",
    ...v.cinematicReferences.map((r) => `- ${r}`),
    "",
    "PRODUCTION CONSIDERATIONS",
    `  Locations: ${prod.locations}`,
    `  VFX: ${prod.vfx}`,
    `  Cast: ${prod.cast}`,
    `  Production scale: ${prod.productionScale}`,
    "",
    "CONSTRAINT VALIDATION",
    ...Object.entries(constraints(v)).map(([dim, explanation]) => `  ${dim}: ${explanation}`),
    "",
    "WHY THIS IDEA IS UNIQUE",
    v.uniquenessNote,
    "",
    "CENTRAL CONFLICT",
    v.centralConflict,
    "",
    `Production complexity: ${v.productionComplexity} | Locations: ${v.estimatedLocations} | Principal cast: ${v.estimatedPrincipalCast} | VFX: ${v.vfxLevelUsed}`,
  ];
  if (v.screenplayExcerpt) {
    lines.push("", "SCREENPLAY EXCERPT", v.screenplayExcerpt);
  }
  return lines.join("\n");
}

export async function renderVariantAsPdf(v: ExportableVariant, title: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
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

  function subheading(text: string) {
    ensureSpace(lineHeight * 1.5);
    page.drawText(text, { x: margin, y, size: 11, font: bold, color: rgb(0.3, 0.3, 0.3) });
    y -= lineHeight * 1.2;
  }

  function paragraph(text: string, useFont = font, size = 10) {
    for (const line of wrap(text, size, useFont)) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: margin, y, size, font: useFont, color: rgb(0.1, 0.1, 0.1) });
      y -= lineHeight;
    }
    y -= lineHeight * 0.5;
  }

  function bulletList(items: string[]) {
    for (const item of items) paragraph(`•  ${item}`);
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

  const { act1, act2, act3 } = acts(v);
  const prod = production(v);

  heading(v.workingTitle);
  paragraph(`${v.genre} · ${v.tone} · ${v.targetAudience}`);

  heading("Logline");
  paragraph(v.logline);
  heading("High Concept");
  paragraph(v.highConcept);
  heading("Theme");
  paragraph(v.theme);
  heading("Emotional Core");
  paragraph(v.emotionalCore);
  heading("World Building");
  paragraph(v.worldBuilding);

  heading("Main Characters");
  for (const c of characters(v)) {
    subheading(`${c.name} (${c.age})`);
    paragraph(`Motivation: ${c.motivation}`);
    paragraph(`Internal conflict: ${c.internalConflict}`);
    paragraph(`External conflict: ${c.externalConflict}`);
    paragraph(`Arc: ${c.arc}`);
  }

  heading("Three-Act Structure");
  subheading("Act I");
  paragraph(`Opening image: ${act1.openingImage}`);
  paragraph(`Inciting incident: ${act1.incitingIncident}`);
  paragraph(`First turning point: ${act1.firstTurningPoint}`);
  subheading("Act II");
  paragraph(`Rising conflict: ${act2.risingConflict}`);
  paragraph(`Midpoint: ${act2.midpoint}`);
  paragraph(`Complications: ${act2.complications}`);
  paragraph(`Lowest point: ${act2.lowestPoint}`);
  subheading("Act III");
  paragraph(`Climax: ${act3.climax}`);
  paragraph(`Resolution: ${act3.resolution}`);
  paragraph(`Final image: ${act3.finalImage}`);

  heading("Major Plot Twists");
  bulletList(v.majorPlotTwists);

  heading("Character Relationships");
  bulletList(v.characterRelationships);

  heading("Visual Style");
  paragraph(v.visualStyle);

  heading("Cinematic References");
  bulletList(v.cinematicReferences);

  heading("Production Considerations");
  paragraph(`Locations: ${prod.locations}`);
  paragraph(`VFX: ${prod.vfx}`);
  paragraph(`Cast: ${prod.cast}`);
  paragraph(`Production scale: ${prod.productionScale}`);

  heading("Constraint Validation");
  for (const [dim, explanation] of Object.entries(constraints(v))) {
    paragraph(`${dim}: ${explanation}`);
  }

  heading("Why This Idea Is Unique");
  paragraph(v.uniquenessNote);

  heading("Central Conflict");
  paragraph(v.centralConflict);

  heading("Production Summary");
  paragraph(
    `Complexity: ${v.productionComplexity} | Locations: ${v.estimatedLocations} | Principal cast: ${v.estimatedPrincipalCast} | VFX: ${v.vfxLevelUsed}`
  );

  if (v.screenplayExcerpt) {
    heading("Screenplay Excerpt");
    for (const line of v.screenplayExcerpt.split("\n")) {
      paragraph(line || " ", mono, 9);
    }
  }

  return doc.save();
}
