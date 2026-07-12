"""NVIDIA NIM model provider — the real generation backend.

Evolved from ai/eval/nim_client.py + prompt_template.py + judge.py
(Milestone 1.1). Same lessons baked in from that harness's real-world
testing: a short client-side timeout with the SDK's own retries disabled
(NIM's shared endpoint can silently queue for 60s+ under load — see
design.md), defensive JSON extraction (some NIM-hosted models leak a few
characters of reasoning around otherwise-valid JSON even with
`response_format: json_object` set), and a generous max_tokens budget
(reasoning models can consume the entire budget on chain-of-thought before
ever emitting the answer).
"""

from __future__ import annotations

import asyncio
import json

from openai import AsyncOpenAI, APIError, APIStatusError

from app.config import Settings
from app.core.json_utils import parse_json_object
from app.schemas import BriefInput, VariantOutput

_MAX_RETRIES = 3
_RETRY_BASE_DELAY_SECONDS = 2.0
_REQUEST_TIMEOUT_SECONDS = 180.0
_GENERATE_MAX_TOKENS = 8192
_JUDGE_MAX_TOKENS = 4096


class _EmptyChoicesError(RuntimeError):
    """Raised when NIM returns HTTP 200 with an empty `choices` list.

    Observed directly (design.md §16/§9, Development Log Entry 16): happens
    under the same backend-degraded conditions that also produce `DEGRADED
    function cannot be invoked` 400s — sometimes the backend instead
    returns a nominally-successful response with nothing in it. Previously
    this surfaced as a raw, unretried `IndexError` from `response.choices[0]`
    that would 500 a real user's "Generate variants" click with no retry
    and no clear error. Treated as a transient, retryable failure, same as
    429/5xx.
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


class NimProvider:
    name = "nim"

    def __init__(self, settings: Settings) -> None:
        if not settings.nim_api_key:
            raise RuntimeError(
                "MODEL_PROVIDER=nim requires NIM_API_KEY to be set in ai-service/.env"
            )
        self.model_name = settings.nim_model_name
        self._client = AsyncOpenAI(
            api_key=settings.nim_api_key,
            base_url=settings.nim_base_url,
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
                    raise _EmptyChoicesError(
                        f"NIM returned HTTP 200 with an empty choices list for model={self.model_name!r}"
                    )
                return response.choices[0].message.content or ""
            except APIStatusError as exc:
                if exc.status_code not in (400, 429, 500, 502, 503, 504):
                    raise
                last_error = exc
            except (APIError, _EmptyChoicesError) as exc:
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
