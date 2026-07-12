/**
 * The camelCase (Prisma) <-> snake_case (AI service) boundary is the one
 * place a field rename on either side has to be caught by hand — there's
 * no shared schema enforcing it at compile time (see mappers.ts). These
 * tests exist specifically to catch that class of regression: every field
 * on both sides, round-tripped, not just a smoke test that the function
 * doesn't throw.
 */

import { describe, expect, it } from "vitest";
import { toBriefPayload, fromVariantPayload, toVariantPayload } from "./mappers";
import type { Brief } from "@/generated/prisma/client";
import type { VariantPayload } from "@/lib/ai-service-client";

describe("toBriefPayload", () => {
  it("maps every camelCase Brief field to its snake_case AI-service equivalent", () => {
    const brief = {
      genres: ["thriller", "drama"],
      audience: "adult",
      budgetTier: "low",
      runtimeMinutes: 100,
      region: "india",
      language: "en",
      censorshipFramework: "cbfc",
      censorshipRating: "UA13",
      locationType: "single_location",
      castSize: "minimal",
      vfxDependency: "none",
      freeformNotes: "a note",
    } as Brief;

    expect(toBriefPayload(brief)).toEqual({
      genres: ["thriller", "drama"],
      audience: "adult",
      budget_tier: "low",
      runtime_minutes: 100,
      region: "india",
      language: "en",
      censorship_framework: "cbfc",
      censorship_rating: "UA13",
      location_type: "single_location",
      cast_size: "minimal",
      vfx_dependency: "none",
      freeform_notes: "a note",
    });
  });

  it("passes through a null freeformNotes rather than coercing it", () => {
    const brief = { ...({} as Brief), freeformNotes: null } as Brief;
    expect(toBriefPayload(brief).freeform_notes).toBeNull();
  });
});

const SAMPLE_PAYLOAD: VariantPayload = {
  working_title: "The Isolation Experiment",
  genre: "psychological thriller",
  tone: "claustrophobic dread",
  target_audience: "adults who like slow-burn tension",
  logline: "A logline",
  high_concept: "One sentence hook",
  theme: "What we owe the people we've let down",
  emotional_core: "Relief of being seen",
  world_building: "A remote research facility.",
  main_characters: [
    {
      name: "Dr. Rohan Patel",
      age: "38",
      motivation: "Understand human resilience",
      internal_conflict: "Fear of losing his grip on reality",
      external_conflict: "The facility itself",
      arc: "Confident to unraveling to changed",
    },
  ],
  three_act_structure: {
    act1: {
      opening_image: "Wide shot of the wilderness",
      inciting_incident: "He seals himself inside",
      first_turning_point: "The first malfunction",
    },
    act2: {
      rising_conflict: "Malfunctions escalate",
      midpoint: "He finds a hidden log",
      complications: "His grip on reality slips",
      lowest_point: "Life support fails",
    },
    act3: {
      climax: "He confronts the truth",
      resolution: "He escapes, changed",
      final_image: "He looks back at the facility",
    },
  },
  major_plot_twists: ["The experiment isn't what he thought"],
  character_relationships: ["Patel vs. his own psyche"],
  visual_style: "High contrast, claustrophobic camera work",
  cinematic_references: ["Alfred Hitchcock — for suspense"],
  production_considerations: {
    locations: "Single set, low cost",
    vfx: "Minimal, practical",
    cast: "One lead",
    production_scale: "Small, tight schedule",
  },
  constraint_validation: { genre: "Satisfies thriller conventions" },
  uniqueness_note: "Leads with an unreliable-experimenter angle",
  central_conflict: "conflict",
  production_complexity: "low",
  estimated_locations: 2,
  estimated_principal_cast: 5,
  vfx_level_used: "none",
  screenplay_excerpt: null,
};

describe("fromVariantPayload", () => {
  it("maps every snake_case AI-service field to its camelCase Prisma equivalent", () => {
    expect(fromVariantPayload(SAMPLE_PAYLOAD)).toEqual({
      workingTitle: SAMPLE_PAYLOAD.working_title,
      genre: SAMPLE_PAYLOAD.genre,
      tone: SAMPLE_PAYLOAD.tone,
      targetAudience: SAMPLE_PAYLOAD.target_audience,
      logline: SAMPLE_PAYLOAD.logline,
      highConcept: SAMPLE_PAYLOAD.high_concept,
      theme: SAMPLE_PAYLOAD.theme,
      emotionalCore: SAMPLE_PAYLOAD.emotional_core,
      worldBuilding: SAMPLE_PAYLOAD.world_building,
      majorPlotTwists: SAMPLE_PAYLOAD.major_plot_twists,
      characterRelationships: SAMPLE_PAYLOAD.character_relationships,
      visualStyle: SAMPLE_PAYLOAD.visual_style,
      cinematicReferences: SAMPLE_PAYLOAD.cinematic_references,
      constraintValidation: SAMPLE_PAYLOAD.constraint_validation,
      uniquenessNote: SAMPLE_PAYLOAD.uniqueness_note,
      centralConflict: SAMPLE_PAYLOAD.central_conflict,
      productionComplexity: SAMPLE_PAYLOAD.production_complexity,
      estimatedLocations: SAMPLE_PAYLOAD.estimated_locations,
      estimatedPrincipalCast: SAMPLE_PAYLOAD.estimated_principal_cast,
      vfxLevelUsed: SAMPLE_PAYLOAD.vfx_level_used,
      screenplayExcerpt: SAMPLE_PAYLOAD.screenplay_excerpt,
      // Nested sub-objects (characters, act structure, production) must
      // have their inner keys converted to camelCase too — Prisma's Json
      // columns store exactly what's given, with no recursive case
      // conversion, so a snake_case leak here would silently read as
      // `undefined` everywhere the UI/export consumes it (a real bug
      // caught this way during the screenplay-ideation redesign).
      mainCharacters: [
        {
          name: "Dr. Rohan Patel",
          age: "38",
          motivation: "Understand human resilience",
          internalConflict: "Fear of losing his grip on reality",
          externalConflict: "The facility itself",
          arc: "Confident to unraveling to changed",
        },
      ],
      threeActStructure: {
        act1: {
          openingImage: "Wide shot of the wilderness",
          incitingIncident: "He seals himself inside",
          firstTurningPoint: "The first malfunction",
        },
        act2: {
          risingConflict: "Malfunctions escalate",
          midpoint: "He finds a hidden log",
          complications: "His grip on reality slips",
          lowestPoint: "Life support fails",
        },
        act3: {
          climax: "He confronts the truth",
          resolution: "He escapes, changed",
          finalImage: "He looks back at the facility",
        },
      },
      productionConsiderations: {
        locations: "Single set, low cost",
        vfx: "Minimal, practical",
        cast: "One lead",
        productionScale: "Small, tight schedule",
      },
    });
  });
});

describe("toVariantPayload", () => {
  it("is the exact inverse of fromVariantPayload for every field, including nested keys", () => {
    const roundTripped = toVariantPayload(fromVariantPayload(SAMPLE_PAYLOAD));
    expect(roundTripped).toEqual(SAMPLE_PAYLOAD);
  });
});
