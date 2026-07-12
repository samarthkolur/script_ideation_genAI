"""Constraint Prompt — renders a `BriefInput` into the explicit constraint
block every generation/refine/screenplay call must satisfy. Separate
module because the same rendering feeds both "here is what you must obey"
(the user message) and, implicitly, what `constraint_validation` in the
output is expected to explain satisfying — one source of truth for what
"the constraints" are, instead of restating them ad hoc per template.
"""

from __future__ import annotations

from app.schemas import BriefInput


def build_constraint_block(brief: BriefInput) -> str:
    genres = " / ".join(brief.genres) if brief.genres else "unspecified"
    lines = [
        f"- Genre(s): {genres}",
        f"- Audience: {brief.audience}",
        f"- Budget tier: {brief.budget_tier}",
        f"- Runtime target: {brief.runtime_minutes} minutes",
        f"- Region/market: {brief.region}",
        f"- Output language: {brief.language}",
        f"- Censorship framework: {brief.censorship_framework}",
        f"- Censorship rating: {brief.censorship_rating}",
        f"- Location type: {brief.location_type}",
        f"- Cast size: {brief.cast_size}",
        f"- VFX dependency: {brief.vfx_dependency}",
    ]
    if brief.freeform_notes:
        lines.append(f"- Additional creative notes from the writer: {brief.freeform_notes}")
    return (
        "Every constraint below must be satisfied simultaneously — not traded off "
        "against each other — and the variant's constraint_validation field must "
        "explain concretely how each one is met:\n" + "\n".join(lines)
    )
