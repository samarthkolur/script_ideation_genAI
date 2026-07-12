"""Provider factory — the one place that knows which concrete
ModelProvider class exists for each `MODEL_PROVIDER` config value.

Adding a new provider: write the class (see base.py's ModelProvider
contract), import it here, add one line to `_PROVIDERS`. Nothing calling
get_provider() needs to change.
"""

from __future__ import annotations

from functools import lru_cache

from app.config import Settings, get_settings
from app.core.providers.base import ModelProvider
from app.core.providers.mock_provider import MockProvider
from app.core.providers.nim_provider import NimProvider


def _build_provider(settings: Settings) -> ModelProvider:
    if settings.model_provider == "mock":
        return MockProvider()
    if settings.model_provider == "nim":
        return NimProvider(settings)
    raise ValueError(
        f"Unknown MODEL_PROVIDER '{settings.model_provider}'. Expected 'mock' or 'nim'."
    )


@lru_cache
def get_provider() -> ModelProvider:
    return _build_provider(get_settings())
