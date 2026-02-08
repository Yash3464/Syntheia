"""
Database models for Syntheia.
Designed to work with SQLAlchemy for future database integration.
"""

from .user import User, UserPreferences
from .learning_path import LearningPath, DailyTask
from .task import Task, TaskCompletion

__all__ = ["User", "UserPreferences", "LearningPath", "DailyTask", "Task", "TaskCompletion"]