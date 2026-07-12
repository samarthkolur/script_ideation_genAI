"""Service configuration — the single place MODEL_PROVIDER (and everything
a provider needs) is read from. This is what makes swapping models a
config change: set MODEL_PROVIDER=mock|nim|groq in ai-service/.env and
nothing else in the codebase needs to change. `MODEL_PROVIDER` is the
server-level default; the sidebar toggle (design.md Entry 19) overrides it
per-request via `GenerateRequest.provider`/`RefineRequest.provider`, not by
changing this setting.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # "mock" (default — no external dependency, see providers/mock_provider.py),
    # "nim" (NVIDIA NIM, see providers/nim_provider.py), or "groq" (see
    # providers/groq_provider.py).
    model_provider: str = "mock"

    nim_api_key: str | None = None
    nim_base_url: str = "https://integrate.api.nvidia.com/v1"
    nim_model_name: str = "minimaxai/minimax-m3"

    groq_api_key: str | None = None
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_model_name: str = "llama-3.3-70b-versatile"

    # Server-to-server auth from the Next.js BFF — the AI service must
    # never be reachable by the browser directly (design.md DD-007).
    ai_service_shared_secret: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
