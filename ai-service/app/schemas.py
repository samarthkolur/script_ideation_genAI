"""Pydantic contract between the Next.js BFF and this service.

Why this exists: this is the one file the BFF's TypeScript client
(frontend/src/lib/ai-service-client.ts) and every ModelProvider
implementation must agree on. Field names mirror the Prisma `Brief`/
`Variant` models 1:1 (snake_case here, camelCase there — converted at the
BFF boundary) so nothing needs remapping beyond that.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class BriefInput(BaseModel):
    genres: list[str]
    audience: str
    budget_tier: str
    runtime_minutes: int
    region: str
    language: str
    censorship_framework: str
    censorship_rating: str
    location_type: str
    cast_size: str
    vfx_dependency: str
    freeform_notes: str | None = None


class ThreeActOutline(BaseModel):
    act1: str
    act2: str
    act3: str


class VariantOutput(BaseModel):
    logline: str
    three_act_outline: ThreeActOutline
    character_archetypes: list[str]
    central_conflict: str
    production_complexity: Literal["low", "medium", "high"]
    estimated_locations: int
    estimated_principal_cast: int
    vfx_level_used: str


class GenerateRequest(BaseModel):
    brief: BriefInput
    variant_count: int = Field(default=3, ge=1, le=6)


class GenerateResponse(BaseModel):
    variants: list[VariantOutput]
    model: str
    provider: str


class RefineRequest(BaseModel):
    brief: BriefInput
    variant: VariantOutput
    instruction: str


class RefineResponse(BaseModel):
    variant: VariantOutput
    model: str
    provider: str


class ValidateRequest(BaseModel):
    brief: BriefInput
    variant: VariantOutput


class ValidateResponse(BaseModel):
    scores: dict[str, int]
    mean_adherence: float
    notes: str = ""
