"""
FastAPI routes for Syntheia backend API.
"""

from fastapi import APIRouter

from .endpoints import learning_path, user, quiz, chat

# Create main router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(learning_path.router, prefix="/learning-paths", tags=["Learning Paths"])
api_router.include_router(user.router, prefix="/users", tags=["Users"])
api_router.include_router(quiz.router, prefix="/quizzes", tags=["Quizzes"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])

__all__ = ["api_router"]