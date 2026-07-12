from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.providers.registry import get_provider
from app.dependencies import verify_shared_secret
from app.schemas import RefineRequest, RefineResponse

router = APIRouter(dependencies=[Depends(verify_shared_secret)])


@router.post("/internal/refine", response_model=RefineResponse)
async def refine(request: RefineRequest) -> RefineResponse:
    provider = get_provider(request.provider)
    try:
        variant = await provider.refine(request.brief, request.variant, request.instruction)
    except Exception as exc:  # noqa: BLE001 - surfaced as a clean 502 to the BFF
        raise HTTPException(status_code=502, detail=f"{provider.name} provider error: {exc}") from exc
    return RefineResponse(variant=variant, model=provider.model_name, provider=provider.name)
