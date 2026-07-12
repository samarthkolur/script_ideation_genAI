/**
 * These enforce the real constraints FR-01 depends on (genre count 1-2,
 * runtime 5-240) — worth locking down with tests since the constraint
 * taxonomy itself is DB-driven and easy to accidentally validate against
 * the wrong bounds if this schema ever drifts from docs/constraint-
 * taxonomy-v1.md.
 */

import { describe, expect, it } from "vitest";
import { briefInputSchema, createProjectSchema, exportVariantSchema, refineVariantSchema } from "./brief";

const VALID_BRIEF = {
  genres: ["thriller"],
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
};

describe("briefInputSchema", () => {
  it("accepts a fully valid brief", () => {
    expect(briefInputSchema.safeParse(VALID_BRIEF).success).toBe(true);
  });

  it("rejects zero genres (CT-01 requires at least one)", () => {
    const result = briefInputSchema.safeParse({ ...VALID_BRIEF, genres: [] });
    expect(result.success).toBe(false);
  });

  it("rejects more than 2 genres (CT-01's blended-genre cap)", () => {
    const result = briefInputSchema.safeParse({ ...VALID_BRIEF, genres: ["drama", "comedy", "thriller"] });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 2 genres (boundary)", () => {
    const result = briefInputSchema.safeParse({ ...VALID_BRIEF, genres: ["drama", "comedy"] });
    expect(result.success).toBe(true);
  });

  it.each([4, 241])("rejects runtimeMinutes outside 5-240 (got %i)", (runtimeMinutes) => {
    const result = briefInputSchema.safeParse({ ...VALID_BRIEF, runtimeMinutes });
    expect(result.success).toBe(false);
  });

  it.each([5, 240])("accepts runtimeMinutes at the boundary (got %i)", (runtimeMinutes) => {
    const result = briefInputSchema.safeParse({ ...VALID_BRIEF, runtimeMinutes });
    expect(result.success).toBe(true);
  });

  it("rejects a non-integer runtime", () => {
    const result = briefInputSchema.safeParse({ ...VALID_BRIEF, runtimeMinutes: 100.5 });
    expect(result.success).toBe(false);
  });

  it("treats freeformNotes as optional", () => {
    expect(briefInputSchema.safeParse(VALID_BRIEF).success).toBe(true);
  });

  it("rejects freeformNotes over 500 characters", () => {
    const result = briefInputSchema.safeParse({ ...VALID_BRIEF, freeformNotes: "x".repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe("createProjectSchema", () => {
  it("rejects a blank title", () => {
    const result = createProjectSchema.safeParse({ title: "  ", brief: VALID_BRIEF });
    expect(result.success).toBe(false);
  });

  it("accepts a valid title + brief", () => {
    const result = createProjectSchema.safeParse({ title: "My project", brief: VALID_BRIEF });
    expect(result.success).toBe(true);
  });
});

describe("refineVariantSchema", () => {
  it("rejects an empty instruction", () => {
    expect(refineVariantSchema.safeParse({ instruction: "" }).success).toBe(false);
  });

  it("rejects a whitespace-only instruction (trimmed to empty)", () => {
    expect(refineVariantSchema.safeParse({ instruction: "   " }).success).toBe(false);
  });

  it("accepts a real instruction", () => {
    expect(refineVariantSchema.safeParse({ instruction: "Darker tone" }).success).toBe(true);
  });
});

describe("exportVariantSchema", () => {
  it.each(["pdf", "text"])("accepts %s", (format) => {
    expect(exportVariantSchema.safeParse({ format }).success).toBe(true);
  });

  it("rejects an unsupported format", () => {
    expect(exportVariantSchema.safeParse({ format: "docx" }).success).toBe(false);
  });
});
