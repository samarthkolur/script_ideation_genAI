"""NVIDIA NIM model provider — thin `OpenAICompatibleProvider` subclass.

All the actual chat/retry/JSON-extraction/prompt logic lives in
openai_compatible.py (shared with GroqProvider) — this file only supplies
NIM's credentials/base_url and the empty-choices guard's context. Evolved
from ai/eval/nim_client.py + prompt_template.py + judge.py (Milestone
1.1); same lessons baked in (short client-side timeout with the SDK's own
retries disabled, defensive JSON extraction, generous max_tokens for
reasoning models) — see design.md.
"""

from __future__ import annotations

from app.config import Settings
from app.core.providers.openai_compatible import OpenAICompatibleProvider


class NimProvider(OpenAICompatibleProvider):
    name = "nim"

    def __init__(self, settings: Settings) -> None:
        if not settings.nim_api_key:
            raise RuntimeError(
                "MODEL_PROVIDER=nim requires NIM_API_KEY to be set in ai-service/.env"
            )
        super().__init__(
            api_key=settings.nim_api_key,
            base_url=settings.nim_base_url,
            model_name=settings.nim_model_name,
        )
