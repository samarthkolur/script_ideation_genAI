"""Diversity seeding for concurrently-generated variants.

Why this exists: generation moved from one call producing all variants
(which let the model see its own prior variants and naturally diverge) to
one concurrent call per variant (see openai_compatible.py) — bounded token
budget per call, so one slow/malformed variant doesn't cost the whole
batch. Without sequential cross-talk, independently-sampled calls tend to
converge on the same obvious genre default. Each call instead gets a
distinct structural/thematic starting directive, cycled by index using the
same shuffle-once-cycle-by-index trick `mock_provider.py` already uses to
guarantee no-repeat pool draws — applied here to prompt-level creative
angles instead of data pools.
"""

from __future__ import annotations

import random

DIVERSITY_SEEDS: list[str] = [
    "Lead from the antagonist or opposing force's point of view for at least one major beat — make their logic coherent, not cartoonish.",
    "Structure the story around a hard ticking-clock deadline that shapes every act's pacing.",
    "Center a found-family or reluctant-alliance dynamic as the emotional engine, not a solo-hero journey.",
    "Build the central conflict around a moral trade-off with no clean right answer, not a clear good-vs-evil line.",
    "Tell it through a fractured or non-linear timeline where the audience assembles the full picture gradually.",
    "Root the story in a single confined setting or tight ensemble rather than a sprawling world.",
    "Make the protagonist's greatest strength also the direct cause of the story's worst complication.",
    "Center an intergenerational or found-mentor relationship where both sides change the other.",
    "Ground the stakes in something small and specific (one relationship, one object, one promise) that the plot makes matter enormously.",
    "Build in a structural rug-pull at the midpoint that recontextualizes everything the audience believed in Act One.",
]


def pick_diversity_seed(variant_index: int, total_variants: int, salt: str) -> str:
    """Deterministic-per-brief but distinct-per-index selection.

    Seeded off `salt` (typically a hash of the brief) so the same brief
    submitted twice gets a stable-but-varied set of angles, while
    different briefs don't all reach for the same first N seeds.
    """
    rng = random.Random(salt)
    pool = DIVERSITY_SEEDS.copy()
    rng.shuffle(pool)
    return pool[variant_index % len(pool)]
