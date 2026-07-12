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

describe("fromVariantPayload", () => {
  it("maps every snake_case AI-service field to its camelCase Prisma equivalent", () => {
    const payload: VariantPayload = {
      logline: "A logline",
      three_act_outline: { act1: "one", act2: "two", act3: "three" },
      character_archetypes: ["mentor", "rival"],
      central_conflict: "conflict",
      production_complexity: "low",
      estimated_locations: 2,
      estimated_principal_cast: 5,
      vfx_level_used: "none",
    };

    expect(fromVariantPayload(payload)).toEqual({
      logline: "A logline",
      threeActOutline: { act1: "one", act2: "two", act3: "three" },
      characterArchetypes: ["mentor", "rival"],
      centralConflict: "conflict",
      productionComplexity: "low",
      estimatedLocations: 2,
      estimatedPrincipalCast: 5,
      vfxLevelUsed: "none",
    });
  });
});

describe("toVariantPayload", () => {
  it("is the exact inverse of fromVariantPayload for every field", () => {
    const original: VariantPayload = {
      logline: "Round trip",
      three_act_outline: { act1: "1", act2: "2", act3: "3" },
      character_archetypes: ["hero"],
      central_conflict: "conflict",
      production_complexity: "medium",
      estimated_locations: 3,
      estimated_principal_cast: 4,
      vfx_level_used: "light",
    };

    const roundTripped = toVariantPayload(fromVariantPayload(original));
    expect(roundTripped).toEqual(original);
  });
});
