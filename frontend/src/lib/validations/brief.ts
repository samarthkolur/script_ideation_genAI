/**
 * Validation for the constraint brief — the one payload shape that flows
 * from the frontend form through the BFF into both Postgres (Brief model)
 * and the AI service (BriefInput schema). Kept loose on the enum values
 * (plain non-empty strings, not Zod enums of the exact CT-01..CT-08 codes)
 * because those codes live in the DB (ConstraintOption, seeded from
 * docs/constraint-taxonomy-v1.md) and can change without a code deploy —
 * hardcoding a Zod enum here would defeat that (see design.md NFR-08).
 */

import { z } from "zod";

// The two providers exposed by the sidebar's NVIDIA/Groq toggle (design.md
// Entry 19) — optional so requests from before the toggle existed (or any
// caller that doesn't care) still validate; the route falls back to the AI
// service's own MODEL_PROVIDER default when omitted.
export const modelProviderSchema = z.enum(["nim", "groq"]).optional();

export const briefInputSchema = z.object({
  genres: z.array(z.string().min(1)).min(1).max(2),
  audience: z.string().min(1),
  budgetTier: z.string().min(1),
  runtimeMinutes: z.number().int().min(5).max(240),
  region: z.string().min(1),
  language: z.string().min(1),
  censorshipFramework: z.string().min(1),
  censorshipRating: z.string().min(1),
  locationType: z.string().min(1),
  castSize: z.string().min(1),
  vfxDependency: z.string().min(1),
  freeformNotes: z.string().max(500).optional(),
  provider: modelProviderSchema,
});
export type BriefInputValues = z.infer<typeof briefInputSchema>;

export const createProjectSchema = z.object({
  title: z.string().trim().min(1, "Give the project a name").max(200),
  brief: briefInputSchema,
});
export type CreateProjectValues = z.infer<typeof createProjectSchema>;

export const refineVariantSchema = z.object({
  instruction: z.string().trim().min(1, "Describe what to change").max(500),
  provider: modelProviderSchema,
});
export type RefineVariantValues = z.infer<typeof refineVariantSchema>;

export const exportVariantSchema = z.object({
  format: z.enum(["pdf", "text"]),
});
export type ExportVariantValues = z.infer<typeof exportVariantSchema>;

export const generateScreenplaySchema = z.object({
  sceneTarget: z.number().int().min(2).max(10).optional(),
  provider: modelProviderSchema,
});
export type GenerateScreenplayValues = z.infer<typeof generateScreenplaySchema>;
