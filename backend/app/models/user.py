from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class UserPreferences(BaseModel):
    preferred_learning_style: str = "mixed"
    daily_study_time_minutes: int = 60
    preferred_difficulty: str = "balanced"
    notifications_enabled: bool = True
    email_updates: bool = False


class User(BaseModel):
    id: Optional[str] = None
    username: str = "learner"
    email: str = "learner@syntheia.app"
    full_name: Optional[str] = None
    experience_level: str = "beginner"
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