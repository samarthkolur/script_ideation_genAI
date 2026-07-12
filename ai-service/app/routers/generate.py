from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.providers.registry import get_provider
from app.dependencies import verify_shared_secret
from app.schemas import GenerateRequest, GenerateResponse

router = APIRouter(dependencies=[Depends(verify_shared_secret)])


@router.post("/internal/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest) -> GenerateResponse:
    provider = get_provider()
    try:
        variants = await provider.generate(request.brief, request.variant_count)
    except Exception as exc:  # noqa: BLE001 - surfaced as a clean 502 to the BFF
        raise HTTPException(status_code=502, detail=f"{provider.name} provider error: {exc}") from exc
    return GenerateResponse(variants=variants, model=provider.model_name, provider=provider.name)
