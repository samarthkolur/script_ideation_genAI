from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.providers.registry import get_provider
from app.dependencies import verify_shared_secret
from app.schemas import ValidateRequest, ValidateResponse

router = APIRouter(dependencies=[Depends(verify_shared_secret)])


@router.post("/internal/validate", response_model=ValidateResponse)
async def validate(request: ValidateRequest) -> ValidateResponse:
    provider = get_provider()
    try:
        scores = await provider.validate(request.brief, request.variant)
    except Exception as exc:  # noqa: BLE001 - surfaced as a clean 502 to the BFF
        raise HTTPException(status_code=502, detail=f"{provider.name} provider error: {exc}") from exc
    mean = sum(scores.values()) / len(scores) if scores else 0.0
    return ValidateResponse(scores=scores, mean_adherence=mean)
