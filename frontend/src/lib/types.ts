/**
 * Provisional types for the creative brief and generated variant.
 *
 * Status: PROVISIONAL. This is a wireframe-stage shape used only to type
 * mock data for Milestone 1.3. The authoritative, versioned contract is
 * the Variant Output Schema produced in Milestone 1.2 (schemas/), which
 * will supersede this file once the backend exists to serve real data
 * against it (Phase 2). Shape mirrors ai/eval/prompt_template.py's output
 * JSON so early UI work doesn't diverge from what's already been tested
 * against the real model in Milestone 1.1.
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

export interface Variant {
  id: string;
  logline: string;
  threeActOutline: ThreeActOutline;
  characterArchetypes: string[];
  centralConflict: string;
  productionComplexity: ProductionComplexity;
  estimatedLocations: number;
  estimatedPrincipalCast: number;
  vfxLevelUsed: string;
}

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  brief: CreativeBrief;
  variantCount: number;
}
