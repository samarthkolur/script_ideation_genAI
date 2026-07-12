/**
 * Server-only typed client for the internal AI service (ai-service/).
 * The only file in the BFF allowed to know that service's URL/secret —
 * every Route Handler calls through this, never `fetch()` directly, so
 * the internal contract (see ai-service/app/schemas.py) is defined once.
 * Never imported by client components (design.md DD-007: the browser
 * never reaches the AI service, only the BFF does, server-side).
 */

import "server-only";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
const AI_SERVICE_SHARED_SECRET = process.env.AI_SERVICE_SHARED_SECRET;

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

export interface ThreeActOutline {
  act1: string;
  act2: string;
  act3: string;
}

export interface VariantPayload {
  logline: string;
  three_act_outline: ThreeActOutline;
  character_archetypes: string[];
  central_conflict: string;
  production_complexity: "low" | "medium" | "high";
  estimated_locations: number;
  estimated_principal_cast: number;
  vfx_level_used: string;
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
  if (!response.ok) {
    const detail = await response.text();
    throw new AiServiceError(`AI service ${path} failed (${response.status}): ${detail}`, response.status);
  }
  return response.json() as Promise<T>;
}

export function generateVariants(brief: BriefPayload, variantCount = 3) {
  return callAiService<{ variants: VariantPayload[]; model: string; provider: string }>(
    "/internal/generate",
    { brief, variant_count: variantCount }
  );
}

export function refineVariant(brief: BriefPayload, variant: VariantPayload, instruction: string) {
  return callAiService<{ variant: VariantPayload; model: string; provider: string }>(
    "/internal/refine",
    { brief, variant, instruction }
  );
}

export function validateVariant(brief: BriefPayload, variant: VariantPayload) {
  return callAiService<{ scores: Record<string, number>; mean_adherence: number; notes: string }>(
    "/internal/validate",
    { brief, variant }
  );
}
