# Enterprise Policy Assistant - Backend

FastAPI backend with 6 core endpoints for the Enterprise Policy Assistant RAG application.

## 🎯 Endpoints Implemented

1. **GET /** - Root endpoint with API metadata
2. **GET /health** - Health check for monitoring
3. **GET /api/openapi.yaml** - OpenAPI 3.1 specification (YAML)
4. **POST /api/auth/register** - User registration with JWT token
5. **POST /api/auth/login** - User authentication with JWT token
6. **GET /api/auth/me** - Get current user (JWT protected)

## 📁 Project Structure

```text
src/backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app + endpoint registration
│   ├── config.py               # Configuration management
│   ├── models/
│   │   ├── __init__.py
│   │   ├── auth.py             # Pydantic models for auth
│   │   └── health.py           # Pydantic models for health
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py             # Auth endpoints: /api/auth/*
│   │   └── health.py           # Health endpoint: /health
│   ├── services/
│   │   ├── __init__.py
│   │   └── auth_service.py     # Authentication business logic
│   └── utils/
│       ├── __init__.py
│       ├── jwt_handler.py      # JWT token creation/validation
│       └── password.py         # Password hashing utilities
├── tests/
│   ├── __init__.py
│   ├── test_health.py
│   ├── test_auth.py
│   ├── test_main.py
│   └── conftest.py             # Pytest fixtures
└── .env.example                # Environment variables template
```

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
# Navigate to project root
cd D:\SrivariHSSPL-2026\enterprise-policy-assistant

# Install all dependencies (production + dev)
uv sync --all-extras --link-mode=copy
```

### 2. Configure Environment

```powershell
cd src\backend
Copy-Item .env.example .env
# Edit .env and set JWT_SECRET_KEY using notepad or VS Code
notepad .env
```

### 3. Start Server

```powershell
# From src/backend directory
uvicorn app.main:app --reload
```

The API will be available at:

- **API Root**: <http://localhost:8000/>
- **Health Check**: <http://localhost:8000/health>
- **Swagger UI**: <http://localhost:8000/api/docs>
- **ReDoc**: <http://localhost:8000/redoc>
- **OpenAPI YAML**: <http://localhost:8000/api/openapi.yaml>

## 🧪 Testing

Run tests with pytest:

```powershell
# From project root
cd src\backend
pytest tests/ -v
```

Run with coverage:

```powershell
pytest tests/ -v --cov=app --cov-report=term-missing
```

## 🔍 Code Quality

All code passes linting and formatting checks:

```powershell
# Format code with black
black app/ tests/

# Sort imports with isort
isort app/ tests/

# Check code style with flake8
flake8 app/ tests/ --max-line-length=120 --extend-ignore=E203,W503
```

## 📝 API Documentation

### Root Endpoint

```powershell
# Using Invoke-RestMethod (recommended for PowerShell)
Invoke-RestMethod -Uri "http://localhost:8000/" | ConvertTo-Json

# Or using curl (if installed)
curl http://localhost:8000/
```

Response:

```json
{
  "status": "ok",
  "message": "Enterprise Policy Assistant API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "openapi": "/api/openapi.yaml",
    "swagger": "/api/docs",
    "redoc": "/redoc"
  }
}
```

### Health Check

```powershell
# Using Invoke-RestMethod
Invoke-RestMethod -Uri "http://localhost:8000/health" | ConvertTo-Json

# Or using curl
curl http://localhost:8000/health
```

Response:

```json
{
  "status": "healthy",
  "message": "All systems operational",
  "timestamp": "2026-02-12T18:10:59.488115"
}
```

### User Registration

```powershell
# Using Invoke-RestMethod (recommended)
$body = @{
    username = "john_doe"
    email = "john.doe@company.com"
    password = "SecurePass123!"
    role = "USER"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/auth/register" `
  -Method Post `
  -Body $body `
  -ContentType "application/json" | ConvertTo-Json

# Or using curl
curl -X POST http://localhost:8000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"username":"john_doe","email":"john.doe@company.com","password":"SecurePass123!","role":"USER"}'
```

Response (201 Created):

```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john.doe@company.com",
    "role": "USER",
    "created_at": "2026-02-12T10:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### User Login

```powershell
# Using Invoke-RestMethod
$loginBody = @{
    username = "john_doe"
    password = "SecurePass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" `
  -Method Post `
  -Body $loginBody `
  -ContentType "application/json"

# Save the token for later use
$token = $response.access_token
$response | ConvertTo-Json

# Or using curl
curl -X POST http://localhost:8000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"john_doe","password":"SecurePass123!"}'
```

Response (200 OK):

```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john.doe@company.com",
    "role": "USER",
    "created_at": "2026-02-12T10:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Get Current User

```powershell
# Using Invoke-RestMethod (use $token from login)
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/auth/me" `
  -Headers $headers | ConvertTo-Json

# Or using curl
curl http://localhost:8000/api/auth/me `
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

Response (200 OK):

```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john.doe@company.com",
    "role": "USER",
    "created_at": "2026-02-12T10:00:00Z"
  }
}
```

## 🔒 Security Features

- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ JWT tokens signed with secret from environment variable
- ✅ Protected endpoints validate JWT tokens
- ✅ No secrets hardcoded in code
- ✅ Input validation with Pydantic
- ✅ CORS middleware configured for frontend integration

## 🔧 Technology Stack

- **Python**: 3.12+
- **FastAPI**: 0.110.0
- **Pydantic**: 2.6.1
- **python-jose**: 3.3.0 (JWT)
- **passlib**: 1.7.4 (bcrypt)
- **psycopg2-binary**: 2.9.10 (PostgreSQL driver)
- **PyYAML**: 6.0.2 (OpenAPI YAML export)

## 📚 Environment Variables

Required environment variables (see `.env.example`):

- `JWT_SECRET_KEY` - Secret key for JWT token signing (REQUIRED)
- `JWT_ALGORITHM` - Algorithm for JWT encoding (default: HS256)
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration in minutes (default: 30)
- `DATABASE_URL` - PostgreSQL connection string (REQUIRED)

## 🎯 Success Criteria Met

- ✅ All 6 endpoints operational
- ✅ OpenAPI 3.1 specification at `/api/openapi.yaml`
- ✅ Interactive Swagger UI at `/api/docs`
- ✅ JWT authentication working
- ✅ Zero linting errors (black, isort, flake8)
- ✅ Comprehensive Pydantic validation
- ✅ Async/await patterns throughout
- ✅ Production-ready error handling

## 📖 Next Steps

1. **Database Setup**: Initialize PostgreSQL database with schema from `infra/database/schema.sql`
2. **Test Coverage**: Complete integration tests with actual database
3. **RAG Endpoints**: Implement policy ingestion and query endpoints
4. **OpenAI Integration**: Add embeddings and LLM completion
5. **Qdrant Integration**: Add vector search capabilities

## 📄 License

MIT License - See LICENSE file for details
