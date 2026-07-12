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
    workingTitle: v.working_title,
    genre: v.genre,
    tone: v.tone,
    targetAudience: v.target_audience,
    logline: v.logline,
    highConcept: v.high_concept,
    theme: v.theme,
    emotionalCore: v.emotional_core,
    worldBuilding: v.world_building,
    // Prisma's Json input type requires an index-signature-compatible
    // shape; these are plain interfaces (see ai-service-client.ts), so a
    // structural cast is needed even though the fields are fully
    // JSON-compatible at runtime (same pattern as the old threeActOutline
    // cast this superseded).
    mainCharacters: v.main_characters as unknown as Prisma.InputJsonValue,
    threeActStructure: v.three_act_structure as unknown as Prisma.InputJsonValue,
    majorPlotTwists: v.major_plot_twists,
    characterRelationships: v.character_relationships,
    visualStyle: v.visual_style,
    cinematicReferences: v.cinematic_references,
    productionConsiderations: v.production_considerations as unknown as Prisma.InputJsonValue,
    constraintValidation: v.constraint_validation as unknown as Prisma.InputJsonValue,
    uniquenessNote: v.uniqueness_note,
    centralConflict: v.central_conflict,
    productionComplexity: v.production_complexity,
    estimatedLocations: v.estimated_locations,
    estimatedPrincipalCast: v.estimated_principal_cast,
    vfxLevelUsed: v.vfx_level_used,
    screenplayExcerpt: v.screenplay_excerpt,
  };
}

export function toVariantPayload(v: {
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
}): VariantPayload {
  return {
    working_title: v.workingTitle,
    genre: v.genre,
    tone: v.tone,
    target_audience: v.targetAudience,
    logline: v.logline,
    high_concept: v.highConcept,
    theme: v.theme,
    emotional_core: v.emotionalCore,
    world_building: v.worldBuilding,
    main_characters: v.mainCharacters as VariantPayload["main_characters"],
    three_act_structure: v.threeActStructure as VariantPayload["three_act_structure"],
    major_plot_twists: v.majorPlotTwists,
    character_relationships: v.characterRelationships,
    visual_style: v.visualStyle,
    cinematic_references: v.cinematicReferences,
    production_considerations: v.productionConsiderations as VariantPayload["production_considerations"],
    constraint_validation: v.constraintValidation as VariantPayload["constraint_validation"],
    uniqueness_note: v.uniquenessNote,
    central_conflict: v.centralConflict,
    production_complexity: v.productionComplexity as VariantPayload["production_complexity"],
    estimated_locations: v.estimatedLocations,
    estimated_principal_cast: v.estimatedPrincipalCast,
    vfx_level_used: v.vfxLevelUsed,
    screenplay_excerpt: v.screenplayExcerpt,
  };
}
