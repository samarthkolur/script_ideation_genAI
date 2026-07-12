"""Deterministic, instant, no-external-dependency model provider.

Why this exists: lets the entire system (frontend -> BFF -> AI service)
be verified end-to-end without depending on any external LLM's
availability — directly motivated by NIM's observed instability during
Milestone 1.1. Not a toy: it reads the actual brief fields and reflects
them back into plausible, varied output, so UI work against it exercises
real data shapes, not lorem-ipsum-shaped mock data.

Set MODEL_PROVIDER=mock (the default, see app/config.py) to use this.
"""

from __future__ import annotations

import hashlib
import random

from app.schemas import BriefInput, ThreeActOutline, VariantOutput

_ARCHETYPE_POOL = [
    "The Reluctant Hero", "The Guarded Mentor", "The Ambitious Rival",
    "The Loyal Confidant", "The Skeptical Authority Figure", "The Wildcard Ally",
    "The Hidden Antagonist", "The Innocent Bystander", "The Voice of Reason",
]

_COMPLEXITY_BY_VFX = {"none": "low", "light": "low", "moderate": "medium", "heavy": "high"}


class MockProvider:
    name = "mock"
    model_name = "mock-deterministic-v1"

    async def generate(self, brief: BriefInput, variant_count: int) -> list[VariantOutput]:
        seed = int(hashlib.sha256(repr(brief.model_dump()).encode()).hexdigest(), 16)
        base_rng = random.Random(seed)
        # Shuffle once per call and cycle through by index — guarantees no
        # two variants read identically for variant_count <= pool size,
        # instead of relying on independent per-variant draws to happen not
        # to collide (they did, in testing: two variants got "a young
        # professional" from the same 4-option pool by coincidence).
        age_pool = base_rng.sample(
            ["a teenager", "a young professional", "a retired veteran", "a child"], k=4
        )
        variants = []
        for i in range(variant_count):
            rng = random.Random(seed + i)
            genre_label = brief.genres[0] if brief.genres else "drama"
            protagonist_age = age_pool[i % len(age_pool)]
            variants.append(
                VariantOutput(
                    logline=(
                        f"When {protagonist_age} in {brief.region} discovers a secret tied to "
                        f"{genre_label}, they must navigate the fallout within a {brief.budget_tier} "
                        f"production's constraints before it upends everything they know."
                    ),
                    three_act_outline=ThreeActOutline(
                        act1=f"We meet the protagonist in their ordinary world, shaped by the {genre_label} tone the brief calls for.",
                        act2=f"The central conflict escalates, testing relationships and forcing hard choices under {brief.budget_tier}-tier production limits.",
                        act3="The protagonist confronts the conflict directly, resolving it in a way that reflects what they learned.",
                    ),
                    character_archetypes=rng.sample(_ARCHETYPE_POOL, k=3),
                    central_conflict=f"An internal struggle between duty and desire, sharpened by the {genre_label} setting.",
                    production_complexity=_COMPLEXITY_BY_VFX.get(brief.vfx_dependency, "medium"),
                    estimated_locations=rng.randint(1, 4),
                    estimated_principal_cast=rng.randint(2, 8),
                    vfx_level_used=brief.vfx_dependency,
                )
            )
        return variants

    async def refine(
        self, brief: BriefInput, variant: VariantOutput, instruction: str
    ) -> VariantOutput:
        # Structural core preserved (AC-04): same outline/characters, only
        # the conflict and logline visibly reflect the instruction, so a
        # refine call is clearly a variant of the input, not a fresh draft.
        return variant.model_copy(
            update={
                "logline": f"{variant.logline} (refined: {instruction})",
                "central_conflict": f"{variant.central_conflict} Refinement applied: {instruction}.",
            }
        )

    async def validate(self, brief: BriefInput, variant: VariantOutput) -> dict[str, int]:
        rng = random.Random(hash(variant.logline))
        dims = [
            "genre_adherence", "audience_adherence", "budget_production_adherence",
            "runtime_plausibility", "region_cultural_fit", "censorship_rating_adherence",
            "language_correctness", "narrative_coherence",
        ]
        return {dim: rng.randint(75, 98) for dim in dims}
