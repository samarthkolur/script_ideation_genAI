"""Curated test brief set for the LLM baseline evaluation.

Why this exists: the plan's testing spec (source plan §11, Phase 1) requires
"a curated test prompt set (minimum 30 prompts) covering all constraint
dimension combinations." Full combinatorial coverage of 8 dimensions is
infeasible (tens of thousands of combinations); instead this uses
deterministic cyclic sampling so every value of every dimension appears
multiple times across the set, plus a handful of hand-picked "stress cases"
that deliberately overload the budget ceiling (e.g. micro-budget + heavy
VFX) to see whether the model reconciles conflicting constraints or just
ignores the cheaper one.

30 English-language cases form the core adherence/diversity/coherence
sample. 8 additional non-English cases (2 each: hi, es, ja, fr) reuse
simple, already-validated constraint combos so language is the only new
variable being tested.
"""

from __future__ import annotations

from .constraints import (
    AUDIENCE_LABELS,
    BUDGET_TIERS,
    CAST_SIZE_MAX,
    ConstraintBrief,
    GENRES,
    LOCATION_TYPE_MAX,
    REGION_DEFAULT_FRAMEWORK,
    REGION_LABELS,
    pick_rating,
)

_AUDIENCES = list(AUDIENCE_LABELS)
_BUDGETS = list(BUDGET_TIERS)
_REGIONS = list(REGION_LABELS)
_RUNTIMES = [15, 30, 90, 105, 120, 150]
_LOCATIONS = list(LOCATION_TYPE_MAX)
_CASTS = list(CAST_SIZE_MAX)


def _generate_core_cases(count: int, language: str, prefix: str) -> list[ConstraintBrief]:
    cases = []
    for i in range(count):
        genre = GENRES[i % len(GENRES)]
        second_genre = GENRES[(i * 3 + 2) % len(GENRES)]
        audience = _AUDIENCES[i % len(_AUDIENCES)]
        budget = _BUDGETS[i % len(_BUDGETS)]
        region = _REGIONS[i % len(_REGIONS)]
        framework = REGION_DEFAULT_FRAMEWORK[region]
        rating = pick_rating(framework, audience)
        runtime = _RUNTIMES[i % len(_RUNTIMES)]
        # Production values scaled loosely to the budget tier so the
        # "clean" core cases are internally consistent; stress cases
        # (below) intentionally violate this.
        ceiling = BUDGET_TIERS[budget][1]
        vfx = ceiling["max_vfx"]
        location = _LOCATIONS[min(i % len(_LOCATIONS), 1 if budget == "micro" else len(_LOCATIONS) - 1)]
        cast = _CASTS[min(i % len(_CASTS), 1 if budget == "micro" else len(_CASTS) - 1)]

        cases.append(
            ConstraintBrief(
                id=f"{prefix}-{i + 1:02d}",
                genres=[genre] if genre == second_genre else [genre, second_genre],
                audience=audience,
                budget_tier=budget,
                runtime_minutes=runtime,
                region=region,
                language=language,
                censorship_framework=framework,
                censorship_rating=rating,
                location_type=location,
                cast_size=cast,
                vfx_dependency=vfx,
            )
        )
    return cases


def _stress_cases() -> list[ConstraintBrief]:
    """Deliberately conflicting briefs: cheap budget, expensive ambitions."""
    return [
        ConstraintBrief(
            id="STRESS-01",
            genres=["scifi", "action"],
            audience="young_adult",
            budget_tier="micro",
            runtime_minutes=105,
            region="us",
            language="en",
            censorship_framework="mpaa",
            censorship_rating="PG13",
            location_type="international",
            cast_size="large_ensemble",
            vfx_dependency="heavy",
        ),
        ConstraintBrief(
            id="STRESS-02",
            genres=["fantasy"],
            audience="family_all_ages",
            budget_tier="low",
            runtime_minutes=120,
            region="uk",
            language="en",
            censorship_framework="bbfc",
            censorship_rating="U",
            location_type="multiple_locations",
            cast_size="large_ensemble",
            vfx_dependency="heavy",
        ),
        ConstraintBrief(
            id="STRESS-03",
            genres=["horror"],
            audience="children",
            budget_tier="micro",
            runtime_minutes=90,
            region="india",
            language="en",
            censorship_framework="cbfc",
            censorship_rating="U",
            location_type="single_location",
            cast_size="minimal",
            vfx_dependency="none",
        ),  # audience/genre tension: horror requested for a children's rating
        ConstraintBrief(
            id="STRESS-04",
            genres=["war", "drama"],
            audience="teen",
            budget_tier="micro",
            runtime_minutes=110,
            region="south_korea",
            language="en",
            censorship_framework="kmrb",
            censorship_rating="12",
            location_type="international",
            cast_size="medium",
            vfx_dependency="moderate",
        ),
    ]


def build_test_set() -> list[ConstraintBrief]:
    cases = _generate_core_cases(30, "en", "TP")
    cases += _stress_cases()
    cases += _generate_core_cases(2, "hi", "ML-HI")
    cases += _generate_core_cases(2, "es", "ML-ES")
    cases += _generate_core_cases(2, "ja", "ML-JA")
    cases += _generate_core_cases(2, "fr", "ML-FR")
    return cases


if __name__ == "__main__":
    test_set = build_test_set()
    print(f"Total test cases: {len(test_set)}")
    for case in test_set:
        print(f"  {case.id}: {case.genres} | {case.budget_tier} | {case.language} | {case.region}")
