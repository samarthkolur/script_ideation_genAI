"""Baseline (un-optimized) generation prompt.

Why this exists: Milestone 1.1 measures what a *naive* single-pass prompt
achieves, to give Milestone 1.2's Prompt Architecture Document a real
before/after comparison. Do not add constraint-enforcement tricks,
few-shot examples, or chain-of-thought scaffolding here — that defeats the
point of a baseline. Optimization belongs in ai/prompts/ (Milestone 1.2).
"""

from __future__ import annotations

import json

SYSTEM_PROMPT = (
    "You are a professional script development assistant helping "
    "screenwriters brainstorm plot ideas. You generate original, "
    "fictional story concepts only — never content based on real "
    "identifiable people or events. Respond with a single JSON object "
    "matching exactly the schema described in the user message, and "
    "nothing else."
)

_USER_TEMPLATE = """Generate {variant_count} distinct plot variants for a film with this brief:

{brief_json}

Each variant must be a genuinely different narrative direction (different \
central conflict or premise) while fitting every constraint above \
simultaneously — genre, audience, budget tier, runtime, region, language, \
censorship rating, and production constraints (location type, cast size, \
VFX dependency).

Write all narrative text (logline, outline, character names/descriptions, \
conflict) in the requested output_language.

Return a single JSON object of the form:
{{
  "variants": [
    {{
      "logline": "one-sentence premise",
      "three_act_outline": {{
        "act1": "setup summary",
        "act2": "confrontation summary",
        "act3": "resolution summary"
      }},
      "character_archetypes": ["archetype 1", "archetype 2", ...],
      "central_conflict": "one to two sentences",
      "production_complexity": "low | medium | high",
      "estimated_locations": <integer>,
      "estimated_principal_cast": <integer>,
      "vfx_level_used": "none | light | moderate | heavy"
    }}
  ]
}}"""


def build_user_prompt(brief: dict, variant_count: int = 3) -> str:
    return _USER_TEMPLATE.format(
        variant_count=variant_count,
        brief_json=json.dumps(brief, indent=2, ensure_ascii=False),
    )
