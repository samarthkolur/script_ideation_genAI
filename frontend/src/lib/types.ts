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
}

export interface ThreeActOutline {
  act1: string;
  act2: string;
  act3: string;
}

export type ProductionComplexity = "low" | "medium" | "high";
export type GenerationRunStatus = "queued" | "generating" | "complete" | "failed";

export interface ApiVariant {
  id: string;
  generationRunId: string;
  index: number;
  logline: string;
  threeActOutline: ThreeActOutline;
  characterArchetypes: string[];
  centralConflict: string;
  productionComplexity: ProductionComplexity;
  estimatedLocations: number;
  estimatedPrincipalCast: number;
  vfxLevelUsed: string;
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
