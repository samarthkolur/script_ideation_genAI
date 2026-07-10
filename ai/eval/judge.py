"""LLM-as-judge scoring for constraint adherence and coherence.

Why this exists: the plan's Phase 1 validation criteria call for coherence
"rated by internal reviewers" and constraint adherence checking. A solo
build has no reviewer panel, so an LLM judge is used as a documented
substitute — a standard practice for baseline eval loops, but the report
must state plainly that this is not a human panel (tracked in design.md
Known Issues / this milestone's report caveats).

The judge is deliberately a separate call at low temperature, given the
brief and the generated variant, and asked to score against an explicit
rubric rather than give a free-form opinion — this keeps scores comparable
across the ~40 test cases.
"""

from __future__ import annotations

import json
from dataclasses import dataclass

from .nim_client import NimClient

JUDGE_SYSTEM_PROMPT = (
    "You are a strict script development evaluator. You score a single "
    "generated plot variant against the creative brief it was supposed to "
    "satisfy. Be skeptical: only give high scores when the variant clearly "
    "and specifically respects a constraint, not just when it doesn't "
    "contradict it. Respond with a single JSON object and nothing else."
)

_JUDGE_USER_TEMPLATE = """Creative brief the variant was supposed to satisfy:
{brief_json}

Generated variant:
{variant_json}

Score this variant 0-100 on each dimension below. For constraint dimensions, \
100 means the variant clearly and specifically reflects that constraint; 0 \
means it ignores or contradicts it.

Return a single JSON object of the form:
{{
  "genre_adherence": <0-100>,
  "audience_adherence": <0-100>,
  "budget_production_adherence": <0-100>,
  "runtime_plausibility": <0-100>,
  "region_cultural_fit": <0-100>,
  "censorship_rating_adherence": <0-100>,
  "language_correctness": <0-100>,
  "narrative_coherence": <0-100>,
  "notes": "one or two sentences on the weakest dimension, if any"
}}"""


@dataclass(frozen=True)
class JudgeScore:
    genre_adherence: int
    audience_adherence: int
    budget_production_adherence: int
    runtime_plausibility: int
    region_cultural_fit: int
    censorship_rating_adherence: int
    language_correctness: int
    narrative_coherence: int
    notes: str

    @property
    def constraint_adherence_mean(self) -> float:
        """Mean of the 7 constraint-dimension scores (excludes coherence)."""
        fields = [
            self.genre_adherence, self.audience_adherence,
            self.budget_production_adherence, self.runtime_plausibility,
            self.region_cultural_fit, self.censorship_rating_adherence,
            self.language_correctness,
        ]
        return sum(fields) / len(fields)


async def judge_variant(
    client: NimClient, *, judge_model: str, brief: dict, variant: dict
) -> JudgeScore:
    result = await client.chat(
        model=judge_model,
        system_prompt=JUDGE_SYSTEM_PROMPT,
        user_prompt=_JUDGE_USER_TEMPLATE.format(
            brief_json=json.dumps(brief, ensure_ascii=False),
            variant_json=json.dumps(variant, ensure_ascii=False),
        ),
        temperature=0.1,
        json_mode=True,
    )
    data = json.loads(result.content)
    return JudgeScore(
        genre_adherence=int(data["genre_adherence"]),
        audience_adherence=int(data["audience_adherence"]),
        budget_production_adherence=int(data["budget_production_adherence"]),
        runtime_plausibility=int(data["runtime_plausibility"]),
        region_cultural_fit=int(data["region_cultural_fit"]),
        censorship_rating_adherence=int(data["censorship_rating_adherence"]),
        language_correctness=int(data["language_correctness"]),
        narrative_coherence=int(data["narrative_coherence"]),
        notes=str(data.get("notes", "")),
    )
