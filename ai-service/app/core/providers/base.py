"""The pluggable model provider interface.

Why this exists: this is the seam the whole "swap models without touching
the rest of the system" requirement is built on. Every router
(app/routers/generate.py, refine.py, validate.py) depends only on this
interface, resolved once via get_provider() (registry.py) — never on
`NimProvider` or any other concrete implementation directly. Adding a new
provider (a different NIM model, a different vendor entirely, a local
model) means writing one class here and registering it in registry.py;
nothing else in the service, the BFF, or the frontend changes.

Built directly in response to build.nvidia.com's free-tier instability
observed during Milestone 1.1 (queue congestion, then a model deployment
going fully "DEGRADED" mid-run) — see design.md. `MockProvider` exists so
the rest of the system is independently verifiable without depending on
any external LLM's uptime at all.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.schemas import BriefInput, VariantOutput


class ModelProvider(ABC):
    """Contract every model backend must implement."""

    name: str
    model_name: str

    @abstractmethod
    async def generate(self, brief: BriefInput, variant_count: int) -> list[VariantOutput]:
        """Produce `variant_count` distinct plot variants for `brief`."""

    @abstractmethod
    async def refine(
        self, brief: BriefInput, variant: VariantOutput, instruction: str
    ) -> VariantOutput:
        """Apply a targeted refinement instruction, preserving structural core."""

    @abstractmethod
    async def validate(self, brief: BriefInput, variant: VariantOutput) -> dict[str, int]:
        """Score `variant` against `brief` per constraint dimension, 0-100 each."""

    @abstractmethod
    async def generate_screenplay(
        self, brief: BriefInput, variant: VariantOutput, scene_target: int
    ) -> str:
        """Produce a formatted, industry-standard screenplay excerpt for `variant`."""
