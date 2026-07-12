"""Template composers — the only module `openai_compatible.py` imports
from. Each `build_*_messages` function composes the separated prompt
pieces (system persona, developer/technical rules, constraint block,
output schema, diversity seed) into exactly the two messages an
OpenAI-compatible chat call accepts: (system, user).
"""

from __future__ import annotations

import hashlib

from app.core.prompts.constraints import build_constraint_block
from app.core.prompts.developer import DEVELOPER_PROMPT, DEVELOPER_SCREENPLAY_PROMPT
from app.core.prompts.diversity import pick_diversity_seed
from app.core.prompts.schema import VARIANT_OUTPUT_SCHEMA_JSON
from app.core.prompts.system import SYSTEM_PROMPT
from app.schemas import BriefInput, VariantOutput


def _brief_hash(brief: BriefInput) -> str:
    return hashlib.sha256(repr(brief.model_dump()).encode()).hexdigest()


def build_generate_messages(
    brief: BriefInput, variant_index: int, total_variants: int
) -> tuple[str, str]:
    system = f"{SYSTEM_PROMPT}\n\n{DEVELOPER_PROMPT}"
    diversity_seed = pick_diversity_seed(variant_index, total_variants, _brief_hash(brief))
    user = f"""{build_constraint_block(brief)}

Creative direction for this specific variant (variant {variant_index + 1} of \
{total_variants} — it must read as a genuinely different film from the \
others, not a reskin): {diversity_seed}

Develop exactly one complete variant. Return a single JSON object matching \
this schema exactly (same keys, same nesting):
{VARIANT_OUTPUT_SCHEMA_JSON}"""
    return system, user


def build_refine_messages(
    brief: BriefInput, variant: VariantOutput, instruction: str
) -> tuple[str, str]:
    system = f"{SYSTEM_PROMPT}\n\n{DEVELOPER_PROMPT}"
    user = f"""{build_constraint_block(brief)}

Current variant:
{variant.model_dump_json(exclude={"screenplay_excerpt"})}

Refinement instruction: {instruction}

Apply this instruction with full craft effort — do not make a superficial \
word-swap. Preserve the structural core (theme, world, main cast, central \
conflict) unless the instruction explicitly asks to change them; every \
section touched by the instruction should be meaningfully rewritten to \
reflect it, at the same length/depth bar as the original. Return a single \
JSON object with exactly the same shape as the current variant above:
{VARIANT_OUTPUT_SCHEMA_JSON}"""
    return system, user


def build_screenplay_messages(
    brief: BriefInput, variant: VariantOutput, scene_target: int
) -> tuple[str, str]:
    system = f"{SYSTEM_PROMPT}\n\n{DEVELOPER_SCREENPLAY_PROMPT}"
    user = f"""{build_constraint_block(brief)}

Variant to dramatize:
{variant.model_dump_json(exclude={"screenplay_excerpt"})}

Write at least {scene_target} scenes covering the opening of this story \
through its first major turning point (the variant's \
three_act_structure.act1.first_turning_point), using the characters, \
world, and tone already established above."""
    return system, user
