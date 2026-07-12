"""Shared base for any OpenAI-compatible chat-completions backend.

Why this exists: `NimProvider` and `GroqProvider` are both literally "an
OpenAI-compatible client pointed at a different base_url/key/model" — same
retry/backoff policy, same defensive JSON extraction, same prompt
templates. Before this existed, that logic was duplicated per-provider
(and per design.md's Technical Debt notes, a duplicated bug already
escaped once — the unguarded `response.choices[0]` empty-list crash, found
and fixed in both `ai/eval/nim_client.py` and this file's predecessor on
the same day). Extracting the shared mechanics here means a fix or a new
provider only touches one place; each subclass only supplies its
credentials/base_url/model_name via `__init__`.
"""

from __future__ import annotations

import asyncio
import json

from openai import AsyncOpenAI, APIError, APIStatusError

from app.core.json_utils import parse_json_object
from app.core.providers.base import ModelProvider
from app.schemas import BriefInput, VariantOutput

_MAX_RETRIES = 3
_RETRY_BASE_DELAY_SECONDS = 2.0
_REQUEST_TIMEOUT_SECONDS = 180.0
_GENERATE_MAX_TOKENS = 8192
_JUDGE_MAX_TOKENS = 4096


class EmptyChoicesError(RuntimeError):
    """Raised when a backend returns HTTP 200 with an empty `choices` list.

    Observed directly against NIM (design.md §16/§9, Development Log Entry
    16) under degraded backend conditions. Treated as a transient,
    retryable failure, same as 429/5xx — not assumed to be provider-
    specific, since any OpenAI-compatible backend could in principle do
    this under load.
    """


_SYSTEM_PROMPT = (
    "You are a professional script development assistant helping "
    "screenwriters brainstorm plot ideas. You generate original, "
    "fictional story concepts only — never content based on real "
    "identifiable people or events. Respond with a single JSON object "
    "matching exactly the schema described in the user message, and "
    "nothing else."
)

_GENERATE_TEMPLATE = """Generate {variant_count} distinct plot variants for a film with this brief:

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
      "three_act_outline": {{"act1": "...", "act2": "...", "act3": "..."}},
      "character_archetypes": ["archetype 1", "archetype 2", ...],
      "central_conflict": "one to two sentences",
      "production_complexity": "low | medium | high",
      "estimated_locations": <integer>,
      "estimated_principal_cast": <integer>,
      "vfx_level_used": "none | light | moderate | heavy"
    }}
  ]
}}"""

_REFINE_TEMPLATE = """Original brief:
{brief_json}

Current variant:
{variant_json}

Refinement instruction: {instruction}

Apply this instruction while preserving the structural core (the same \
central premise and characters) unless the instruction explicitly asks to \
change them. Return a single JSON object with exactly the same shape as \
the current variant above (logline, three_act_outline, \
character_archetypes, central_conflict, production_complexity, \
estimated_locations, estimated_principal_cast, vfx_level_used)."""

_VALIDATE_TEMPLATE = """Creative brief the variant was supposed to satisfy:
{brief_json}

Generated variant:
{variant_json}

Score this variant 0-100 on each dimension below. 100 means the variant \
clearly and specifically reflects that constraint; 0 means it ignores or \
contradicts it.

Return a single JSON object of the form:
{{
  "genre_adherence": <0-100>, "audience_adherence": <0-100>,
  "budget_production_adherence": <0-100>, "runtime_plausibility": <0-100>,
  "region_cultural_fit": <0-100>, "censorship_rating_adherence": <0-100>,
  "language_correctness": <0-100>, "narrative_coherence": <0-100>
}}"""


class OpenAICompatibleProvider(ModelProvider):
    """Base for any vendor exposing an OpenAI-compatible chat.completions API."""

    def __init__(self, *, api_key: str, base_url: str, model_name: str) -> None:
        self.model_name = model_name
        self._client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
            timeout=_REQUEST_TIMEOUT_SECONDS,
            max_retries=0,
        )

    async def _chat(self, *, system: str, user: str, temperature: float, max_tokens: int) -> str:
        last_error: Exception | None = None
        for attempt in range(_MAX_RETRIES):
            try:
                response = await self._client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens,
                    response_format={"type": "json_object"},
                )
                if not response.choices:
                    raise EmptyChoicesError(
                        f"{self.name} returned HTTP 200 with an empty choices list for model={self.model_name!r}"
                    )
                return response.choices[0].message.content or ""
            except APIStatusError as exc:
                if exc.status_code not in (400, 429, 500, 502, 503, 504):
                    raise
                last_error = exc
            except (APIError, EmptyChoicesError) as exc:
                last_error = exc
            if attempt < _MAX_RETRIES - 1:
                await asyncio.sleep(_RETRY_BASE_DELAY_SECONDS * (2**attempt))
        assert last_error is not None
        raise last_error

    async def generate(self, brief: BriefInput, variant_count: int) -> list[VariantOutput]:
        content = await self._chat(
            system=_SYSTEM_PROMPT,
            user=_GENERATE_TEMPLATE.format(
                variant_count=variant_count,
                brief_json=json.dumps(brief.model_dump(), indent=2, ensure_ascii=False),
            ),
            temperature=0.9,
            max_tokens=_GENERATE_MAX_TOKENS,
        )
        parsed = parse_json_object(content)
        return [VariantOutput.model_validate(v) for v in parsed.get("variants", [])]

    async def refine(
        self, brief: BriefInput, variant: VariantOutput, instruction: str
    ) -> VariantOutput:
        content = await self._chat(
            system=_SYSTEM_PROMPT,
            user=_REFINE_TEMPLATE.format(
                brief_json=json.dumps(brief.model_dump(), ensure_ascii=False),
                variant_json=variant.model_dump_json(),
                instruction=instruction,
            ),
            temperature=0.7,
            max_tokens=_GENERATE_MAX_TOKENS,
        )
        return VariantOutput.model_validate(parse_json_object(content))

    async def validate(self, brief: BriefInput, variant: VariantOutput) -> dict[str, int]:
        content = await self._chat(
            system="You are a strict script development evaluator. Respond with a single JSON object and nothing else.",
            user=_VALIDATE_TEMPLATE.format(
                brief_json=json.dumps(brief.model_dump(), ensure_ascii=False),
                variant_json=variant.model_dump_json(),
            ),
            temperature=0.1,
            max_tokens=_JUDGE_MAX_TOKENS,
        )
        return {k: int(v) for k, v in parse_json_object(content).items()}
