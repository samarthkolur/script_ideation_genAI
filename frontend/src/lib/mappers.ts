/**
 * Prisma models use camelCase (JS/TS convention); the AI service's schema
 * (ai-service/app/schemas.py) uses snake_case (Python convention). This is
 * the one place that boundary is crossed, so a field rename on either side
 * only needs a change here, not at every call site.
 */

import type { Brief, Prisma } from "@/generated/prisma/client";
import type {
  BriefPayload,
  MainCharacterPayload,
  ProductionConsiderationsPayload,
  ThreeActStructurePayload,
  VariantPayload,
} from "@/lib/ai-service-client";
import type { MainCharacter, ProductionConsiderations, ThreeActStructure } from "@/lib/types";

// The AI service's nested sub-objects (main_characters, three_act_structure,
// production_considerations) are snake_case at every level, not just the
// top level — Prisma's Json columns store exactly what's given with no
// recursive case conversion, so this has to be done explicitly here or
// every consumer (UI, export) silently reads `undefined` off a
// snake_case key it thinks is camelCase.
function charactersFromPayload(characters: MainCharacterPayload[]): MainCharacter[] {
  return characters.map((c) => ({
    name: c.name,
    age: c.age,
    motivation: c.motivation,
    internalConflict: c.internal_conflict,
    externalConflict: c.external_conflict,
    arc: c.arc,
  }));
}

function charactersToPayload(characters: MainCharacter[]): MainCharacterPayload[] {
  return characters.map((c) => ({
    name: c.name,
    age: c.age,
    motivation: c.motivation,
    internal_conflict: c.internalConflict,
    external_conflict: c.externalConflict,
    arc: c.arc,
  }));
}

function structureFromPayload(s: ThreeActStructurePayload): ThreeActStructure {
  return {
    act1: {
      openingImage: s.act1.opening_image,
      incitingIncident: s.act1.inciting_incident,
      firstTurningPoint: s.act1.first_turning_point,
    },
    act2: {
      risingConflict: s.act2.rising_conflict,
      midpoint: s.act2.midpoint,
      complications: s.act2.complications,
      lowestPoint: s.act2.lowest_point,
    },
    act3: {
      climax: s.act3.climax,
      resolution: s.act3.resolution,
      finalImage: s.act3.final_image,
    },
  };
}

function structureToPayload(s: ThreeActStructure): ThreeActStructurePayload {
  return {
    act1: {
      opening_image: s.act1.openingImage,
      inciting_incident: s.act1.incitingIncident,
      first_turning_point: s.act1.firstTurningPoint,
    },
    act2: {
      rising_conflict: s.act2.risingConflict,
      midpoint: s.act2.midpoint,
      complications: s.act2.complications,
      lowest_point: s.act2.lowestPoint,
    },
    act3: {
      climax: s.act3.climax,
      resolution: s.act3.resolution,
      final_image: s.act3.finalImage,
    },
  };
}

function productionFromPayload(p: ProductionConsiderationsPayload): ProductionConsiderations {
  return { locations: p.locations, vfx: p.vfx, cast: p.cast, productionScale: p.production_scale };
}

function productionToPayload(p: ProductionConsiderations): ProductionConsiderationsPayload {
  return { locations: p.locations, vfx: p.vfx, cast: p.cast, production_scale: p.productionScale };
}

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
    // shape; these are plain interfaces (see lib/types.ts), so a
    // structural cast is needed even though the fields are fully
    // JSON-compatible at runtime (same pattern as the old threeActOutline
    // cast this superseded). Nested keys are converted to camelCase above
    // via charactersFromPayload/structureFromPayload/productionFromPayload
    // — Prisma stores exactly what's given, no recursive case conversion.
    mainCharacters: charactersFromPayload(v.main_characters) as unknown as Prisma.InputJsonValue,
    threeActStructure: structureFromPayload(v.three_act_structure) as unknown as Prisma.InputJsonValue,
    majorPlotTwists: v.major_plot_twists,
    characterRelationships: v.character_relationships,
    visualStyle: v.visual_style,
    cinematicReferences: v.cinematic_references,
    productionConsiderations: productionFromPayload(v.production_considerations) as unknown as Prisma.InputJsonValue,
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
    main_characters: charactersToPayload(v.mainCharacters as MainCharacter[]),
    three_act_structure: structureToPayload(v.threeActStructure as ThreeActStructure),
    major_plot_twists: v.majorPlotTwists,
    character_relationships: v.characterRelationships,
    visual_style: v.visualStyle,
    cinematic_references: v.cinematicReferences,
    production_considerations: productionToPayload(v.productionConsiderations as ProductionConsiderations),
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
