"""Shared base for any OpenAI-compatible chat-completions backend.

Why this exists: `NimProvider` and `GroqProvider` are both literally "an
OpenAI-compatible client pointed at a different base_url/key/model" — same
retry/backoff policy, same defensive JSON extraction, same prompt
pipeline (app/core/prompts/). Before this existed, that logic was
duplicated per-provider (and per design.md's Technical Debt notes, a
duplicated bug already escaped once — the unguarded `response.choices[0]`
empty-list crash, found and fixed in both `ai/eval/nim_client.py` and this
file's predecessor on the same day). Extracting the shared mechanics here
means a fix or a new provider only touches one place; each subclass only
supplies its credentials/base_url/model_name via `__init__`.

Generation strategy: each variant is now a full 18-section, 1200-2000-word
development document (see design.md's screenplay-ideation redesign), not a
short JSON fragment — one call asking for all of `variant_count` variants
at once would risk truncation/timeout on top of NIM/Groq's already-
documented reliability issues (design.md §9/§16). Instead `generate()`
fires one concurrent call per variant (`asyncio.gather`), each with its
own bounded token budget and the full retry/backoff machinery below,
differentiated by a diversity-seed directive (see
`core/prompts/diversity.py`) so independently-sampled calls still diverge.
"""

from __future__ import annotations

import asyncio

from openai import AsyncOpenAI, APIError, APIStatusError

from app.config import get_settings
from app.core.json_utils import parse_json_object
from app.core.prompts.templates import (
    build_generate_messages,
    build_refine_messages,
    build_screenplay_messages,
)
from app.core.providers.base import ModelProvider
from app.schemas import BriefInput, VariantOutput

_MAX_RETRIES = 3
_RETRY_BASE_DELAY_SECONDS = 2.0
_REQUEST_TIMEOUT_SECONDS = 180.0
_JUDGE_MAX_TOKENS = 4096

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


class EmptyChoicesError(RuntimeError):
    """Raised when a backend returns HTTP 200 with an empty `choices` list.

    Observed directly against NIM (design.md §16/§9, Development Log Entry
    16) under degraded backend conditions. Treated as a transient,
    retryable failure, same as 429/5xx — not assumed to be provider-
    specific, since any OpenAI-compatible backend could in principle do
    this under load.
    """


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
        settings = get_settings()
        # Bounded, not unlimited, concurrency — see config.py's
        # max_concurrent_variant_generations for why unlimited fan-out
        # reproduces vendor-side TPM rate-limit failures at a larger scale.
        semaphore = asyncio.Semaphore(settings.max_concurrent_variant_generations)

        async def _generate_one(index: int) -> VariantOutput:
            async with semaphore:
                system, user = build_generate_messages(brief, index, variant_count)
                content = await self._chat(
                    system=system,
                    user=user,
                    temperature=1.0,
                    max_tokens=settings.generate_max_tokens_per_variant,
                )
            return VariantOutput.model_validate(parse_json_object(content))

        return list(
            await asyncio.gather(*(_generate_one(i) for i in range(variant_count)))
        )

    async def refine(
        self, brief: BriefInput, variant: VariantOutput, instruction: str
    ) -> VariantOutput:
        settings = get_settings()
        system, user = build_refine_messages(brief, variant, instruction)
        content = await self._chat(
            system=system,
            user=user,
            temperature=0.8,
            max_tokens=settings.generate_max_tokens_per_variant,
        )
        return VariantOutput.model_validate(parse_json_object(content))

    async def generate_screenplay(
        self, brief: BriefInput, variant: VariantOutput, scene_target: int
    ) -> str:
        settings = get_settings()
        system, user = build_screenplay_messages(brief, variant, scene_target)
        content = await self._chat(
            system=system,
            user=user,
            temperature=0.85,
            max_tokens=settings.screenplay_max_tokens,
        )
        parsed = parse_json_object(content)
        return str(parsed["screenplay_excerpt"])

    async def validate(self, brief: BriefInput, variant: VariantOutput) -> dict[str, int]:
        content = await self._chat(
            system="You are a strict script development evaluator. Respond with a single JSON object and nothing else.",
            user=_VALIDATE_TEMPLATE.format(
                brief_json=brief.model_dump_json(),
                variant_json=variant.model_dump_json(exclude={"screenplay_excerpt"}),
            ),
            temperature=0.1,
            max_tokens=_JUDGE_MAX_TOKENS,
        )
        return {k: int(v) for k, v in parse_json_object(content).items()}
