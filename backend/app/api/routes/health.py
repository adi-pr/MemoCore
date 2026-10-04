from fastapi import APIRouter

from app.schema.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    return {
        "status": "ok"
    }
