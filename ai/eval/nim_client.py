"""Thin client around NVIDIA NIM's OpenAI-compatible endpoint.

Why this exists: every eval component (generation, judge scoring) needs to
call a NIM-hosted model. Centralizing the client here means the base_url,
auth, and retry behavior are defined once — swapping providers (e.g. for
local development without a NIM key) is a config change here, not a
find-and-replace across the eval suite (see design.md DD-003).
"""

from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass

from dotenv import load_dotenv
from openai import AsyncOpenAI, APIError, APIStatusError

load_dotenv()

_DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1"
_MAX_RETRIES = 3
_RETRY_BASE_DELAY_SECONDS = 2.0


@dataclass(frozen=True)
class ChatResult:
    model: str
    content: str
    finish_reason: str | None


class NimClient:
    """Async wrapper for chat completions against NVIDIA NIM."""

    def __init__(self) -> None:
        api_key = os.environ.get("NVIDIA_API_KEY")
        if not api_key:
            raise RuntimeError(
                "NVIDIA_API_KEY is not set. Copy .env.example to .env at the "
                "project root and set your build.nvidia.com API key."
            )
        base_url = os.environ.get("NVIDIA_NIM_BASE_URL", _DEFAULT_BASE_URL)
        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    async def chat(
        self,
        *,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.9,
        max_tokens: int = 2048,
        json_mode: bool = False,
    ) -> ChatResult:
        """Single chat completion call with exponential-backoff retry.

        Retries are for transient NIM-side errors (429/5xx) only — a bad
        prompt or invalid model name fails fast rather than retrying 3x.
        """
        kwargs: dict = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        last_error: Exception | None = None
        for attempt in range(_MAX_RETRIES):
            try:
                response = await self._client.chat.completions.create(**kwargs)
                choice = response.choices[0]
                return ChatResult(
                    model=model,
                    content=choice.message.content or "",
                    finish_reason=choice.finish_reason,
                )
            except APIStatusError as exc:
                if exc.status_code not in (429, 500, 502, 503, 504):
                    raise
                last_error = exc
            except APIError as exc:
                last_error = exc

            if attempt < _MAX_RETRIES - 1:
                await asyncio.sleep(_RETRY_BASE_DELAY_SECONDS * (2**attempt))

        assert last_error is not None
        raise last_error
