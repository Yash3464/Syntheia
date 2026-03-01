"""
User models for learning profiles.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr


class UserPreferences(BaseModel):
    """User learning preferences."""
    preferred_learning_style: str = "mixed"  # visual, auditory, kinesthetic, mixed
    daily_study_time_minutes: int = 60
    preferred_difficulty: str = "balanced"  # easy, balanced, challenging
    notifications_enabled: bool = True
    email_updates: bool = True


class User(BaseModel):
    """User model for personalized learning."""
    id: Optional[str] = None
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    experience_level: str = "beginner"  # beginner, intermediate, advanced
    current_goal: Optional[str] = None
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    
model_config = {
    "json_schema_extra": {
        "example": {
            "username": "learner123",
            "email": "learner@example.com",
            "full_name": "John Doe",
            "experience_level": "beginner",
            "current_goal": "Learn Python for data analysis",
            "preferences": {
                "preferred_learning_style": "visual",
                "daily_study_time_minutes": 90,
                "preferred_difficulty": "balanced"
            }
        }
    }
}