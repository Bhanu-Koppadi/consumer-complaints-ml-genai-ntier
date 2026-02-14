"""Health check router."""

from datetime import datetime, timezone

from app.models.health import HealthResponse
from fastapi import APIRouter

router = APIRouter(tags=["System"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check endpoint",
    description="Returns the health status of the API service. Used by monitoring systems and load balancers.",
    responses={
        200: {
            "description": "Service is healthy",
            "content": {
                "application/json": {
                    "example": {
                        "status": "healthy",
                        "message": "All systems operational",
                        "timestamp": "2026-02-12T23:30:00Z",
                    }
                }
            },
        }
    },
)
async def health_check() -> HealthResponse:
    """Check API health status.

    Returns:
        HealthResponse with current status and timestamp
    """
    return HealthResponse(status="healthy", message="All systems operational", timestamp=datetime.now(timezone.utc))
