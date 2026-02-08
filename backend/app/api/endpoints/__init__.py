"""
API endpoints package.
"""

from .learning_path import router as learning_path_router
from .user import router as user_router
from .quiz import router as quiz_router

__all__ = ["learning_path_router", "user_router", "quiz_router"]