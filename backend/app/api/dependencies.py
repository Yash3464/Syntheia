"""
Dependencies for FastAPI routes.
"""

from typing import Generator
from fastapi import Depends, HTTPException, status

from app.services.plan_service import PlanService
from app.services.quiz_service import QuizService


# Service instances (in production, use dependency injection)
plan_service = PlanService()
quiz_service = QuizService()


def get_plan_service() -> Generator:
    """Dependency to get PlanService instance."""
    try:
        yield plan_service
    finally:
        pass


def get_quiz_service() -> Generator:
    """Dependency to get QuizService instance."""
    try:
        yield quiz_service
    finally:
        pass