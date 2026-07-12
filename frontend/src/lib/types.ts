/**
 * Real API response types (Phase 2) — supersedes the Phase 1 "provisional"
 * shape this file used to hold (see git history). Dates come over the
 * wire as ISO strings (JSON has no Date type), which is why these aren't
 * just the Prisma-generated model types directly.
 */

export interface CreativeBrief {
  genres: string[];
  audience: string;
  budgetTier: string;
  runtimeMinutes: number;
  region: string;
  language: string;
  censorshipFramework: string;
  censorshipRating: string;
  locationType: string;
  castSize: string;
  vfxDependency: string;
  freeformNotes?: string;
  // Which model backend to generate with — the sidebar's NVIDIA/Groq toggle
  // (design.md Entry 19). Optional: omitted means "use the AI service's
  // configured default."
  provider?: "nim" | "groq";
}

export interface MainCharacter {
  name: string;
  age: string;
  motivation: string;
  internalConflict: string;
  externalConflict: string;
  arc: string;
}

export interface ActOne {
  openingImage: string;
  incitingIncident: string;
  firstTurningPoint: string;
}

export interface ActTwo {
  risingConflict: string;
  midpoint: string;
  complications: string;
  lowestPoint: string;
}

export interface ActThree {
  climax: string;
  resolution: string;
  finalImage: string;
}

export interface ThreeActStructure {
  act1: ActOne;
  act2: ActTwo;
  act3: ActThree;
}

export interface ProductionConsiderations {
  locations: string;
  vfx: string;
  cast: string;
  productionScale: string;
}

export type ProductionComplexity = "low" | "medium" | "high";
export type GenerationRunStatus = "queued" | "generating" | "complete" | "failed";

export interface ApiVariant {
  id: string;
  generationRunId: string;
  index: number;
  workingTitle: string;
  genre: string;
  tone: string;
  targetAudience: string;
  logline: string;
  highConcept: string;
  theme: string;
  emotionalCore: string;
  worldBuilding: string;
  mainCharacters: MainCharacter[];
  threeActStructure: ThreeActStructure;
  majorPlotTwists: string[];
  characterRelationships: string[];
  visualStyle: string;
  cinematicReferences: string[];
  productionConsiderations: ProductionConsiderations;
  constraintValidation: Record<string, string>;
  uniquenessNote: string;
  centralConflict: string;
  productionComplexity: ProductionComplexity;
  estimatedLocations: number;
  estimatedPrincipalCast: number;
  vfxLevelUsed: string;
  screenplayExcerpt: string | null;
  createdAt: string;
}

/** GET /api/variants/[id] includes the parent chain (for the "back to project" link and export title) that the plain ApiVariant shape (embedded in ApiGenerationRun below) doesn't need. */
export interface ApiVariantDetail extends ApiVariant {
  generationRun: {
    id: string;
    brief: {
      id: string;
      project: { id: string; title: string };
    };
  };
}

export interface ApiGenerationRun {
  id: string;
  briefId: string;
  model: string;
  status: GenerationRunStatus;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  variants: ApiVariant[];
}

export interface ApiBrief extends CreativeBrief {
  id: string;
  projectId: string;
  version: number;
  createdAt: string;
  generationRuns: ApiGenerationRun[];
}

export interface ApiProject {
  id: string;
  organizationId: string;
  title: string;
  createdById: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  briefs: ApiBrief[];
}

export interface ConstraintOptionDto {
  id: string;
  dimension: string;
  code: string;
  label: string;
  metadata: Record<string, unknown> | null;
  sortOrder: number;
  isActive: boolean;
}

/** Keyed by dimension (e.g. "genre", "budget_tier") — matches /api/constraint-taxonomy's grouping. */
export type ConstraintTaxonomy = Record<string, ConstraintOptionDto[]>;
