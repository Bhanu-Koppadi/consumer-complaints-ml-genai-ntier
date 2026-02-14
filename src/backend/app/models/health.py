"""Pydantic models for health check endpoint."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response model.

    Attributes:
        status: Health status (healthy, degraded, or unhealthy)
        message: Human-readable status message
        timestamp: ISO 8601 timestamp of the health check
    """

    status: Literal["healthy", "degraded", "unhealthy"] = Field(
        ..., description="Service health status", examples=["healthy"]
    )
    message: str = Field(..., description="Human-readable status message", examples=["All systems operational"])
    timestamp: datetime = Field(..., description="Timestamp of health check", examples=["2026-02-12T23:30:00Z"])
