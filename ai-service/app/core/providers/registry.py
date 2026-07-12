"""Provider factory — the one place that knows which concrete
ModelProvider class exists for each provider name.

Adding a new provider: write the class (see base.py's ModelProvider
contract), import it here, add one line to `_build_provider`. Nothing
calling get_provider() needs to change.

`get_provider(name)` takes an explicit provider name rather than only
reading `settings.model_provider` — this is what makes the frontend's
NVIDIA/Groq sidebar toggle (design.md Entry 19) possible: each request can
ask for a specific provider, not just whatever the server was started
with. `name=None` falls back to the server's configured default
(`MODEL_PROVIDER`), which is what every caller that predates the toggle
(the eval harness, `/internal/validate`) still gets. Cached per distinct
name so repeated requests for the same provider reuse one client instance
instead of reconnecting every call.
"""

from __future__ import annotations

from functools import lru_cache

from app.config import Settings, get_settings
from app.core.providers.base import ModelProvider
from app.core.providers.groq_provider import GroqProvider
from app.core.providers.mock_provider import MockProvider
from app.core.providers.nim_provider import NimProvider

_VALID_PROVIDERS = ("mock", "nim", "groq")


def _build_provider(settings: Settings, provider_name: str) -> ModelProvider:
    if provider_name == "mock":
        return MockProvider()
    if provider_name == "nim":
        return NimProvider(settings)
    if provider_name == "groq":
        return GroqProvider(settings)
    raise ValueError(
        f"Unknown provider '{provider_name}'. Expected one of {_VALID_PROVIDERS}."
    )


@lru_cache
def get_provider(name: str | None = None) -> ModelProvider:
    settings = get_settings()
    return _build_provider(settings, name or settings.model_provider)
