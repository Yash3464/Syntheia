"""
Task and completion tracking models.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class DifficultyLevel(str, Enum):
    """Difficulty level of a task."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Task(BaseModel):
    """Individual learning task."""
    id: str
    module_id: str
    level: str
    title: str
    description: str
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    estimated_time_minutes: int
    prerequisites: List[str] = []
    learning_outcomes: List[str] = []
    resources: List[str] = []  # Links to materials


class TaskCompletion(BaseModel):
    """Record of task completion."""
    id: Optional[str] = None
    user_id: str
    task_id: str
    completion_date: str = Field(default_factory=lambda: datetime.now().isoformat())
    time_spent_minutes: int
    confidence_score: Optional[int] = Field(None, ge=1, le=5)  # 1-5 scale
    notes: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)  # 1-5 scale