/**
 * Prisma models use camelCase (JS/TS convention); the AI service's schema
 * (ai-service/app/schemas.py) uses snake_case (Python convention). This is
 * the one place that boundary is crossed, so a field rename on either side
 * only needs a change here, not at every call site.
 */

import type { Brief, Prisma } from "@/generated/prisma/client";
import type { BriefPayload, VariantPayload } from "@/lib/ai-service-client";

export function toBriefPayload(brief: Brief): BriefPayload {
  return {
    genres: brief.genres,
    audience: brief.audience,
    budget_tier: brief.budgetTier,
    runtime_minutes: brief.runtimeMinutes,
    region: brief.region,
    language: brief.language,
    censorship_framework: brief.censorshipFramework,
    censorship_rating: brief.censorshipRating,
    location_type: brief.locationType,
    cast_size: brief.castSize,
    vfx_dependency: brief.vfxDependency,
    freeform_notes: brief.freeformNotes,
  };
}

export function fromVariantPayload(v: VariantPayload) {
  return {
    logline: v.logline,
    // Prisma's Json input type requires an index-signature-compatible
    // shape; ThreeActOutline is a plain interface (act1/act2/act3), so a
    // structural cast is needed even though the fields are fully
    // JSON-compatible at runtime.
    threeActOutline: v.three_act_outline as unknown as Prisma.InputJsonValue,
    characterArchetypes: v.character_archetypes,
    centralConflict: v.central_conflict,
    productionComplexity: v.production_complexity,
    estimatedLocations: v.estimated_locations,
    estimatedPrincipalCast: v.estimated_principal_cast,
    vfxLevelUsed: v.vfx_level_used,
  };
}

export function toVariantPayload(v: {
  logline: string;
  threeActOutline: unknown;
  characterArchetypes: string[];
  centralConflict: string;
  productionComplexity: string;
  estimatedLocations: number;
  estimatedPrincipalCast: number;
  vfxLevelUsed: string;
}): VariantPayload {
  return {
    logline: v.logline,
    three_act_outline: v.threeActOutline as VariantPayload["three_act_outline"],
    character_archetypes: v.characterArchetypes,
    central_conflict: v.centralConflict,
    production_complexity: v.productionComplexity as VariantPayload["production_complexity"],
    estimated_locations: v.estimatedLocations,
    estimated_principal_cast: v.estimatedPrincipalCast,
    vfx_level_used: v.vfxLevelUsed,
  };
}
