"""
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import api_router
from app.utils.constants import RESPONSE_MESSAGES


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup/shutdown events.
    
    In production, you would:
    - Initialize database connection
    - Load AI models
    - Start background tasks
    """
    # Startup
    print("🚀 Starting Syntheia Learning Path Generator...")
    print("📚 Available modules: Python")
    print("🎯 Features: Personalized planning, intelligent rescheduling, AI recommendations")
    
    yield
    
    # Shutdown
    print("👋 Shutting down Syntheia...")


# Create FastAPI app
app = FastAPI(
    title="Syntheia Learning Path Generator",
    description="AI-Powered Personalized Learning Path Generator with Intelligent Rescheduling",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to Syntheia Learning Path Generator API",
        "version": "1.0.0",
        "documentation": "/docs",
        "endpoints": {
            "learning_paths": "/api/v1/learning-paths",
            "users": "/api/v1/users",
            "quizzes": "/api/v1/quizzes"
        },
        "features": [
            "Personalized learning path generation",
            "Intelligent rescheduling for missed days",
            "AI-powered recommendations",
            "Progress tracking and analytics"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": "datetime.now().isoformat()",
        "service": "Syntheia Learning Path Generator"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Auto-reload during development
    )