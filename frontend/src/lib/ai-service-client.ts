/**
 * Server-only typed client for the internal AI service (ai-service/).
 * The only file in the BFF allowed to know that service's URL/secret —
 * every Route Handler calls through this, never `fetch()` directly, so
 * the internal contract (see ai-service/app/schemas.py) is defined once.
 * Never imported by client components (design.md DD-007: the browser
 * never reaches the AI service, only the BFF does, server-side).
 */

import "server-only";
import { logger } from "@/lib/logger";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
const AI_SERVICE_SHARED_SECRET = process.env.AI_SERVICE_SHARED_SECRET;

/**
 * The two providers exposed by the sidebar's NVIDIA/Groq toggle (design.md
 * Entry 19) — deliberately narrower than the AI service's own
 * `Literal["mock", "nim", "groq"]`, since "mock" is a server-side/dev
 * fallback, not something the public UI should be able to select.
 */
export type ModelProviderName = "nim" | "groq";

export interface BriefPayload {
  genres: string[];
  audience: string;
  budget_tier: string;
  runtime_minutes: number;
  region: string;
  language: string;
  censorship_framework: string;
  censorship_rating: string;
  location_type: string;
  cast_size: string;
  vfx_dependency: string;
  freeform_notes?: string | null;
}

export interface MainCharacterPayload {
  name: string;
  age: string;
  motivation: string;
  internal_conflict: string;
  external_conflict: string;
  arc: string;
}

export interface ThreeActStructurePayload {
  act1: { opening_image: string; inciting_incident: string; first_turning_point: string };
  act2: { rising_conflict: string; midpoint: string; complications: string; lowest_point: string };
  act3: { climax: string; resolution: string; final_image: string };
}

export interface ProductionConsiderationsPayload {
  locations: string;
  vfx: string;
  cast: string;
  production_scale: string;
}

export interface VariantPayload {
  working_title: string;
  genre: string;
  tone: string;
  target_audience: string;
  logline: string;
  high_concept: string;
  theme: string;
  emotional_core: string;
  world_building: string;
  main_characters: MainCharacterPayload[];
  three_act_structure: ThreeActStructurePayload;
  major_plot_twists: string[];
  character_relationships: string[];
  visual_style: string;
  cinematic_references: string[];
  production_considerations: ProductionConsiderationsPayload;
  constraint_validation: Record<string, string>;
  uniqueness_note: string;
  central_conflict: string;
  production_complexity: "low" | "medium" | "high";
  estimated_locations: number;
  estimated_principal_cast: number;
  vfx_level_used: string;
  screenplay_excerpt: string | null;
}

class AiServiceError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AiServiceError";
  }
}

async function callAiService<T>(path: string, body: unknown): Promise<T> {
  const startedAt = Date.now();
  const response = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AI_SERVICE_SHARED_SECRET ? { "X-Internal-Secret": AI_SERVICE_SHARED_SECRET } : {}),
    },
    body: JSON.stringify(body),
    // The AI service can be genuinely slow (NIM queueing — see design.md
    // §16). No default Next.js fetch timeout is short enough to be safe
    // here; let the AI service's own internal timeout (180s, nim_provider.py)
    // be the real bound.
    cache: "no-store",
  });
  const durationMs = Date.now() - startedAt;
  if (!response.ok) {
    const detail = await response.text();
    logger.error({ path, status: response.status, durationMs, detail }, "AI service call failed");
    throw new AiServiceError(`AI service ${path} failed (${response.status}): ${detail}`, response.status);
  }
  logger.info({ path, durationMs }, "AI service call succeeded");
  return response.json() as Promise<T>;
}

export function generateVariants(
  brief: BriefPayload,
  variantCount = 3,
  provider?: ModelProviderName
) {
  return callAiService<{ variants: VariantPayload[]; model: string; provider: string }>(
    "/internal/generate",
    { brief, variant_count: variantCount, ...(provider ? { provider } : {}) }
  );
}

export function refineVariant(
  brief: BriefPayload,
  variant: VariantPayload,
  instruction: string,
  provider?: ModelProviderName
) {
  return callAiService<{ variant: VariantPayload; model: string; provider: string }>(
    "/internal/refine",
    { brief, variant, instruction, ...(provider ? { provider } : {}) }
  );
}

export function validateVariant(brief: BriefPayload, variant: VariantPayload) {
  return callAiService<{ scores: Record<string, number>; mean_adherence: number; notes: string }>(
    "/internal/validate",
    { brief, variant }
  );
}

export function generateScreenplay(
  brief: BriefPayload,
  variant: VariantPayload,
  sceneTarget = 4,
  provider?: ModelProviderName
) {
  return callAiService<{ screenplay_excerpt: string; model: string; provider: string }>(
    "/internal/screenplay",
    { brief, variant, scene_target: sceneTarget, ...(provider ? { provider } : {}) }
  );
}
