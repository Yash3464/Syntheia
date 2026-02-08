"""
Learning path models for tracking progress.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class TaskStatus(str, Enum):
    """Status of a learning task."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    MISSED = "missed"
    SKIPPED = "skipped"


class DailyTask(BaseModel):
    """Daily learning task."""
    day_number: int
    date: Optional[str] = None
    topic_ids: List[str]
    topics: List[str]
    estimated_time_minutes: int
    status: TaskStatus = TaskStatus.PENDING
    actual_time_minutes: Optional[int] = None
    completion_date: Optional[str] = None
    notes: str = ""
    resources: List[str] = []  # URLs, book chapters, video links


class LearningPath(BaseModel):
    """Complete learning path for a user."""
    id: Optional[str] = None
    user_id: str
    plan_id: str
    module_id: str
    level: str
    pace: str
    start_date: str
    target_end_date: Optional[str] = None
    actual_end_date: Optional[str] = None
    total_days: int
    total_hours: float = 0.0

    completed_days: int = 0
    completion_percentage: float = 0.0
    daily_tasks: List[DailyTask] = []
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    
    def update_progress(self):
        """Update completion metrics."""
        completed = sum(1 for task in self.daily_tasks if task.status == TaskStatus.COMPLETED)
        self.completed_days = completed
        self.completion_percentage = round((completed / self.total_days) * 100, 2) if self.total_days > 0 else 0
        
        if completed == self.total_days and self.total_days > 0:
            self.actual_end_date = datetime.now().isoformat()
            self.is_active = False
    
    def get_day_status(self, day_number: int) -> Optional[TaskStatus]:
        """Get status of a specific day."""
        for task in self.daily_tasks:
            if task.day_number == day_number:
                return task.status
        return None
    
    def mark_day_completed(self, day_number: int, actual_time: Optional[int] = None):
        """Mark a day as completed."""
        for task in self.daily_tasks:
            if task.day_number == day_number:
                task.status = TaskStatus.COMPLETED
                task.completion_date = datetime.now().isoformat()
                if actual_time:
                    task.actual_time_minutes = actual_time
                break
        self.update_progress()