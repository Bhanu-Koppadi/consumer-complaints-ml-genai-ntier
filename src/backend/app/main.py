"""Consumer Complaints Classification System FastAPI Application.

Main application entry point with OpenAPI configuration,
endpoint registration, and middleware setup.
"""

import yaml
from app.routers import auth, health
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

# Initialize FastAPI app with OpenAPI metadata
app = FastAPI(
    title="Consumer Complaints Classification System API",
    description=(
        "RAG-based policy query system with OpenAI and Qdrant. "
        "Enables semantic search of enterprise policy documents with "
        "accurate, source-grounded responses."
    ),
    version="1.0.0",
    contact={
        "name": "Viswanatha Swamy P K",
        "email": "support@enterprise-policy-assistant.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=[
        {
            "name": "System",
            "description": "System health and metadata endpoints",
        },
        {
            "name": "Authentication",
            "description": "User registration, login, and profile management",
        },
        {
            "name": "Documentation",
            "description": "API documentation and OpenAPI specification",
        },
    ],
    docs_url="/api/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(auth.router)


@app.get(
    "/",
    tags=["System"],
    summary="Root endpoint with API metadata",
    description="Returns API information and navigation links to documentation and endpoints.",
    responses={
        200: {
            "description": "API information",
            "content": {
                "application/json": {
                    "example": {
                        "status": "ok",
                        "message": "Consumer Complaints Classification System API",
                        "version": "1.0.0",
                        "endpoints": {
                            "health": "/health",
                            "openapi": "/api/openapi.yaml",
                            "swagger": "/api/docs",
                            "redoc": "/redoc",
                        },
                    }
                }
            },
        }
    },
)
async def root() -> dict:
    """Root endpoint with API metadata.

    Returns:
        Dictionary with API information and endpoint links
    """
    return {
        "status": "ok",
        "message": "Consumer Complaints Classification System API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "openapi": "/api/openapi.yaml",
            "swagger": "/api/docs",
            "redoc": "/redoc",
        },
    }


@app.get(
    "/api/openapi.yaml",
    tags=["Documentation"],
    summary="Get OpenAPI 3.1 specification in YAML format",
    description="Download the complete OpenAPI specification in YAML format.",
    response_class=PlainTextResponse,
    responses={
        200: {
            "description": "OpenAPI YAML specification",
            "content": {"application/x-yaml": {"schema": {"type": "string"}}},
        }
    },
)
async def get_openapi_yaml() -> PlainTextResponse:
    """Get OpenAPI specification in YAML format.

    Returns:
        YAML formatted OpenAPI specification
    """
    openapi_schema = app.openapi()

    # Add security schemes
    if "components" not in openapi_schema:
        openapi_schema["components"] = {}
    if "securitySchemes" not in openapi_schema["components"]:
        openapi_schema["components"]["securitySchemes"] = {}

    openapi_schema["components"]["securitySchemes"]["bearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Enter JWT token obtained from /api/auth/login or /api/auth/register",
    }

    # Convert to YAML
    yaml_content = yaml.dump(openapi_schema, sort_keys=False, default_flow_style=False)

    return PlainTextResponse(content=yaml_content, media_type="application/x-yaml")
