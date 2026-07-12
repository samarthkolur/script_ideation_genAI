"""Deterministic, instant, no-external-dependency model provider.

Why this exists: lets the entire system (frontend -> BFF -> AI service)
be verified end-to-end without depending on any external LLM's
availability — directly motivated by NIM's observed instability during
Milestone 1.1. Not a toy: it reads the actual brief fields and reflects
them back into plausible, varied output, so UI work against it exercises
real data shapes, not lorem-ipsum-shaped mock data. Updated for the
screenplay-ideation redesign's much richer `VariantOutput` shape (see
design.md) — every new section gets real, structured (if templated)
content so every UI tab is exercisable against mock data alone.

Set MODEL_PROVIDER=mock (the default, see app/config.py) to use this.
"""

from __future__ import annotations

import hashlib
import random

from app.schemas import (
    ActOne,
    ActThree,
    ActTwo,
    BriefInput,
    MainCharacter,
    ProductionConsiderations,
    ThreeActStructure,
    VariantOutput,
)

_NAME_POOL = [
    "Mara Okafor", "Ilya Voss", "Priya Nandan", "Theo Marchetti",
    "Sana Kade", "Ruben Alvez", "Noor Farah", "Callum Reyes",
]
_AGE_POOL = ["17", "24", "31", "45", "58", "63"]
_TONE_POOL = [
    "slow-burn dread, wry gallows humor", "elegiac and hushed",
    "propulsive and paranoid", "warm ache under a hard shell",
    "clinical precision, sudden tenderness",
]
_VISUAL_STYLE_POOL = [
    "handheld intimacy against wide, still landscapes",
    "symmetrical frames that slowly go crooked as control slips",
    "practical light sources only, shadows doing the talking",
    "long unbroken takes that trap the audience in real time",
]
_REFERENCE_POOL = [
    "Denis Villeneuve — for patient scale and visual restraint",
    "Bong Joon-ho — for tonal whiplash under tight genre plotting",
    "Christopher Nolan — for structural audacity around a single idea",
    "Studio Ghibli — for grounding wonder in small, human gestures",
]
_TWIST_POOL = [
    "the ally who's been quietly working against the goal from page one",
    "the 'solution' from act one becomes act three's biggest liability",
    "the antagonist's real target was never the protagonist",
]
_COMPLEXITY_BY_VFX = {"none": "low", "light": "low", "moderate": "medium", "heavy": "high"}


def _pool_cycle(rng: random.Random, pool: list[str], count: int) -> list[str]:
    """Shuffle once, cycle by index — no duplicate draws within one call
    even when count > distinct sampling would otherwise risk collisions
    (the original bug this pattern was introduced to fix, see design.md
    DD-016)."""
    shuffled = pool.copy()
    rng.shuffle(shuffled)
    return [shuffled[i % len(shuffled)] for i in range(count)]


class MockProvider:
    name = "mock"
    model_name = "mock-deterministic-v1"

    async def generate(self, brief: BriefInput, variant_count: int) -> list[VariantOutput]:
        seed = int(hashlib.sha256(repr(brief.model_dump()).encode()).hexdigest(), 16)
        base_rng = random.Random(seed)
        name_pool = base_rng.sample(_NAME_POOL, k=min(len(_NAME_POOL), 4 * max(variant_count, 1)))
        return [
            self._build_variant(brief, index, variant_count, name_pool, random.Random(seed + index))
            for index in range(variant_count)
        ]

    def _build_variant(
        self,
        brief: BriefInput,
        index: int,
        total: int,
        name_pool: list[str],
        rng: random.Random,
    ) -> VariantOutput:
        genre_label = brief.genres[0] if brief.genres else "drama"
        names = name_pool[index * 2 : index * 2 + 2] or ["Alex Rivera", "Jordan Kim"]
        protagonist, foil = names[0], names[-1]
        age = rng.choice(_AGE_POOL)
        tone = _pool_cycle(rng, _TONE_POOL, 1)[0]
        visual_style = _pool_cycle(rng, _VISUAL_STYLE_POOL, 1)[0]

        main_characters = [
            MainCharacter(
                name=protagonist,
                age=age,
                motivation=f"To resolve the fallout of a secret tied to {genre_label} before it costs them everything.",
                internal_conflict="A belief that asking for help is a form of failure.",
                external_conflict=f"A {brief.region}-rooted institution/rival ({foil}) actively working against them.",
                arc=f"Opens guarded and self-reliant; ends having let {foil} in, at real cost.",
            ),
            MainCharacter(
                name=foil,
                age=rng.choice(_AGE_POOL),
                motivation="To protect what they built, even if it means opposing the protagonist.",
                internal_conflict="Loyalty to an old promise that no longer serves anyone.",
                external_conflict=f"Direct opposition to {protagonist}'s goal.",
                arc="Starts as obstacle, ends forced to choose a side.",
            ),
        ]

        three_act = ThreeActStructure(
            act1=ActOne(
                opening_image=f"{protagonist} alone in a space that defines their ordinary world, framed by the {genre_label} tone the brief calls for.",
                inciting_incident=f"A discovery tied to {genre_label} disrupts {protagonist}'s ordinary world.",
                first_turning_point=f"{protagonist} commits to acting on it, over {foil}'s objection.",
            ),
            act2=ActTwo(
                rising_conflict=f"Each attempt to resolve the conflict costs {protagonist} more, escalating under {brief.budget_tier}-tier production limits.",
                midpoint=f"A reversal reframes what {protagonist} thought was true about {foil}.",
                complications="The protagonist's own flaw starts actively worsening the situation.",
                lowest_point=f"{protagonist} loses the one relationship that mattered most going in.",
            ),
            act3=ActThree(
                climax=f"{protagonist} and {foil} confront the conflict directly, on {protagonist}'s terms this time.",
                resolution="The world and the protagonist both visibly change as a result.",
                final_image="A mirrored echo of the opening image, now meaning something different.",
            ),
        )

        return VariantOutput(
            working_title=f"{genre_label.title()} of {brief.region.title()}" if brief.region else f"Working Title {index + 1}",
            genre=genre_label,
            tone=tone,
            target_audience=f"{brief.audience} audiences drawn to {genre_label}",
            logline=(
                f"When {protagonist}, {age}, in {brief.region} uncovers a secret tied to "
                f"{genre_label}, they must navigate the fallout within a {brief.budget_tier} "
                f"production's constraints before it upends everything they know."
            ),
            high_concept=f"A {genre_label} story where the real threat is what {protagonist} has to become to win.",
            theme="What we owe the people we've already let down.",
            emotional_core=f"The relief of being truly seen by {foil}, even after everything.",
            world_building=(
                f"Set in {brief.region}, a place shaped by the pressures of {genre_label} storytelling — "
                f"institutions that look orderly on the surface and improvise underneath. Mock-generated "
                f"placeholder world detail (real providers write 150-300 words here)."
            ),
            main_characters=main_characters,
            three_act_structure=three_act,
            major_plot_twists=_pool_cycle(rng, _TWIST_POOL, 2),
            character_relationships=[
                f"{protagonist} and {foil} start as adversaries; by Act III, {foil} is the only one who understands what {protagonist} sacrificed.",
            ],
            visual_style=visual_style,
            cinematic_references=_pool_cycle(rng, _REFERENCE_POOL, 2),
            production_considerations=ProductionConsiderations(
                locations=f"{brief.location_type} keeps the shoot within {brief.budget_tier}-tier scope.",
                vfx=f"{brief.vfx_dependency} VFX dependency achieved mostly practically.",
                cast=f"{brief.cast_size} cast sized for a {brief.budget_tier} budget.",
                production_scale=f"A {_COMPLEXITY_BY_VFX.get(brief.vfx_dependency, 'medium')}-complexity shoot, {brief.runtime_minutes} minutes of runtime.",
            ),
            constraint_validation={
                "genre": f"Central conflict is built directly from {genre_label} conventions.",
                "audience": f"Content calibrated for {brief.audience}.",
                "censorship": f"Stays within {brief.censorship_framework} {brief.censorship_rating}.",
                "runtime": f"Scope sized for {brief.runtime_minutes} minutes.",
                "region": f"Setting and cultural texture rooted in {brief.region}.",
                "language": f"Written in {brief.language}.",
                "budget": f"Scale matches {brief.budget_tier} tier.",
                "production_limitations": f"{brief.location_type}, {brief.cast_size} cast, {brief.vfx_dependency} VFX all respected.",
            },
            uniqueness_note=f"Variant {index + 1} of {total} — leads with a distinct structural angle rather than the {genre_label} default.",
            central_conflict=f"An internal struggle between duty and desire, sharpened by the {genre_label} setting.",
            production_complexity=_COMPLEXITY_BY_VFX.get(brief.vfx_dependency, "medium"),
            estimated_locations=rng.randint(1, 4),
            estimated_principal_cast=rng.randint(2, 8),
            vfx_level_used=brief.vfx_dependency,
        )

    async def refine(
        self, brief: BriefInput, variant: VariantOutput, instruction: str
    ) -> VariantOutput:
        # Structural core preserved (AC-04): same world/characters/structure,
        # only the fields most likely touched by a free-text instruction
        # visibly reflect it, so a refine call is clearly a variant of the
        # input, not a fresh draft. screenplay_excerpt intentionally resets
        # to None — a refined variant needs its own screenplay regenerated.
        return variant.model_copy(
            update={
                "logline": f"{variant.logline} (refined: {instruction})",
                "central_conflict": f"{variant.central_conflict} Refinement applied: {instruction}.",
                "uniqueness_note": f"{variant.uniqueness_note} Refined per: \"{instruction}\".",
                "screenplay_excerpt": None,
            }
        )

    async def generate_screenplay(
        self, brief: BriefInput, variant: VariantOutput, scene_target: int
    ) -> str:
        protagonist = variant.main_characters[0].name if variant.main_characters else "PROTAGONIST"
        foil = variant.main_characters[1].name if len(variant.main_characters) > 1 else "FOIL"
        scenes = []
        for i in range(max(scene_target, 2)):
            location = "INT. UNDISCLOSED LOCATION" if i % 2 == 0 else "EXT. CITY STREET"
            time_of_day = "NIGHT" if i % 2 == 0 else "DAY"
            scenes.append(
                f"{location} – {time_of_day}\n\n"
                f"{protagonist.upper()} stands at the center of the frame, weighing a choice "
                f"the brief's {variant.genre} premise has been building toward.\n\n"
                f"{protagonist.upper()}\n(quiet)\nI'm not doing this the way you want me to.\n\n"
                f"{foil.upper()} steps into view, unconvinced.\n\n"
                f"{foil.upper()}\nYou never do.\n\nCUT TO:"
            )
        body = "\n\n".join(scenes)
        return f"FADE IN:\n\n{body}\n\nFADE OUT.\n\nTHE END."

    async def validate(self, brief: BriefInput, variant: VariantOutput) -> dict[str, int]:
        rng = random.Random(hash(variant.logline))
        dims = [
            "genre_adherence", "audience_adherence", "budget_production_adherence",
            "runtime_plausibility", "region_cultural_fit", "censorship_rating_adherence",
            "language_correctness", "narrative_coherence",
        ]
        return {dim: rng.randint(75, 98) for dim in dims}
