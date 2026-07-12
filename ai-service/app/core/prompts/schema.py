"""Output Schema Prompt — the literal JSON shape description shared by the
generate and refine templates, so the schema is defined once instead of
duplicated (and silently drifting) across templates. Mirrors
`app.schemas.VariantOutput` field-for-field; keep the two in sync by hand
(there is no codegen step from Pydantic to prompt text — a mismatch would
surface as a Pydantic ValidationError on the response, not silently).
"""

from __future__ import annotations

VARIANT_OUTPUT_SCHEMA_JSON = """{
  "working_title": "a real-sounding film title, not a placeholder",
  "genre": "the specific genre or genre blend this variant leans into",
  "tone": "2-4 words capturing the tonal register (e.g. 'slow-burn dread, wry gallows humor')",
  "target_audience": "who this is for and why it will land with them",
  "logline": "one or two cinematic sentences: protagonist, goal, obstacle, stakes",
  "high_concept": "the single-sentence hook that would get this greenlit in one pitch meeting",
  "theme": "the human question this story is actually asking",
  "emotional_core": "the feeling the audience should leave with, and why this story earns it",
  "world_building": "150-300 words establishing setting, rules of the world, atmosphere, and what makes it visually/culturally specific",
  "main_characters": [
    {
      "name": "character name",
      "age": "age or age range",
      "motivation": "what they want and why, stated as a concrete goal",
      "internal_conflict": "the belief or wound working against them",
      "external_conflict": "the person, force, or system working against them",
      "arc": "who they are at the start vs. who they become by the end, and what forces the change"
    }
  ],
  "three_act_structure": {
    "act1": {
      "opening_image": "the first thing we see and what it establishes",
      "inciting_incident": "the specific event that ends the ordinary world",
      "first_turning_point": "the choice or event that commits the protagonist to the story"
    },
    "act2": {
      "rising_conflict": "how obstacles escalate and compound, not repeat",
      "midpoint": "the reversal or revelation that changes the story's direction",
      "complications": "how the stakes personalize and the protagonist's flaw starts costing them",
      "lowest_point": "the all-is-lost beat and what specifically breaks"
    },
    "act3": {
      "climax": "the final confrontation and how it pays off the setup",
      "resolution": "what changes in the world and in the character",
      "final_image": "the closing image and how it mirrors or inverts the opening image"
    }
  },
  "major_plot_twists": ["each a specific, earned turn — not a random reveal"],
  "character_relationships": ["each a specific dynamic between two named characters and how it shifts across the story"],
  "visual_style": "concrete visual/cinematographic direction — color, camera language, pacing, texture",
  "cinematic_references": ["filmmaker or studio names whose craft sensibility this evokes, each with a short reason why"],
  "production_considerations": {
    "locations": "how the budget tier shapes location count/type and what that costs the shoot",
    "vfx": "how the budget tier shapes what VFX work is feasible and what's achieved practically instead",
    "cast": "how the budget tier shapes cast size and the kind of names/experience level realistic to attach",
    "production_scale": "overall read on shoot scale — schedule length, unit count, practical vs. digital tradeoffs"
  },
  "constraint_validation": {
    "genre": "how the variant concretely satisfies the requested genre(s)",
    "audience": "how it fits the stated audience",
    "censorship": "how content stays within the stated framework/rating",
    "runtime": "why the story's scope fits the target runtime",
    "region": "how setting/culture fits the requested region/market",
    "language": "confirmation of output language",
    "budget": "how the story's scale fits the budget tier",
    "production_limitations": "how location type, cast size, and VFX dependency are respected"
  },
  "uniqueness_note": "what specifically makes this variant an original, non-generic take rather than a familiar genre default",
  "central_conflict": "one to two sentences naming the core dramatic conflict driving the whole story",
  "production_complexity": "low | medium | high",
  "estimated_locations": "<integer>",
  "estimated_principal_cast": "<integer>",
  "vfx_level_used": "none | light | moderate | heavy"
}"""
