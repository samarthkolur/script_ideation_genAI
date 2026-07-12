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

    # Token budgets for the screenplay-ideation prompt pipeline (see
    # core/prompts/). Each generate call now produces ONE full 18-section,
    # 1200-2000 word development document (not a whole batch — see
    # openai_compatible.py's per-variant concurrent generation), so this is
    # sized per-variant, not per-request. Tunable without a code change.
    generate_max_tokens_per_variant: int = 5000
    screenplay_max_tokens: int = 6000

    # Firing every variant's generation call fully concurrently sounds
    # free (they're independent HTTP calls) but isn't: vendor accounts
    # enforce a tokens-per-minute (TPM) budget shared across all in-flight
    # requests, and each of these rich, per-variant calls reserves
    # thousands of tokens. Confirmed directly against Groq's on-demand
    # tier (12000 TPM): even just 2 concurrent calls at this file's
    # default generate_max_tokens_per_variant (5000, ~6800-6900 total
    # with prompt overhead) collided and one 429'd — two concurrent calls
    # alone exceed a 12000 TPM budget at this token size. Defaulting to 1
    # (fully sequential) is the only setting confirmed reliable on this
    # tier; each call still gets the full retry/backoff machinery, and a
    # single failed variant no longer costs the whole batch (see
    # openai_compatible.py). Raise this once verified against a
    # higher-TPM tier/account.
    max_concurrent_variant_generations: int = 1


@lru_cache
def get_settings() -> Settings:
    return Settings()
