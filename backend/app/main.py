"""
GenAI Stack Builder - FastAPI Backend

A No-Code/Low-Code AI workflow builder backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .config import settings
from .database import init_db
from .routers import stacks_router, documents_router, execute_router

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Backend API for the GenAI Stack Builder - a no-code AI workflow platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(stacks_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(execute_router, prefix="/api")


@app.middleware("http")
async def log_requests(request, call_next):
    origin = request.headers.get("origin")
    if origin:
        print(f"DEBUG: Request Origin: {origin}")
    response = await call_next(request)
    return response


@app.on_event("startup")
async def startup_event():
    """Initialize database and create directories on startup."""
    # Create upload directory
    os.makedirs(settings.upload_directory, exist_ok=True)
    os.makedirs(settings.chroma_persist_directory, exist_ok=True)
    
    # Initialize database tables
    try:
        init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"⚠️ Database initialization skipped (may need PostgreSQL): {e}")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running",
        "docs": "/api/docs"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected" if settings.database_url else "not configured"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
