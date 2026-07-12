"""Groq model provider — thin `OpenAICompatibleProvider` subclass.

Added alongside the NVIDIA/Groq sidebar toggle (design.md, Development Log
Entry 19) — Groq's inference is dramatically faster than NIM's shared
tier (LPU hardware, sub-second completions vs. NIM's 30-90s), and this
project's NIM candidates have all had some form of shared-tier reliability
problem today (queue congestion, `DEGRADED` outages, reasoning-model
slowness). Groq is a second, independent vendor behind the same
`ModelProvider` interface — if one vendor has an outage, the other is
usually unaffected.
"""

from __future__ import annotations

from app.config import Settings
from app.core.providers.openai_compatible import OpenAICompatibleProvider


class GroqProvider(OpenAICompatibleProvider):
    name = "groq"

    def __init__(self, settings: Settings) -> None:
        if not settings.groq_api_key:
            raise RuntimeError(
                "provider=groq requires GROQ_API_KEY to be set in ai-service/.env"
            )
        super().__init__(
            api_key=settings.groq_api_key,
            base_url=settings.groq_base_url,
            model_name=settings.groq_model_name,
        )
