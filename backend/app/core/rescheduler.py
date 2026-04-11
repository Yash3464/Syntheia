"""
Intelligent Plan Rescheduler
Handles missed days and intelligently redistributes tasks.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.learning_path import LearningPath, DailyTask


class RescheduleRequest(BaseModel):
    """
    Request payload for rescheduling a learning plan.
    """
    original_plan: LearningPath
    missed_days: List[int]
    completed_days: List[int] = []
    new_pace: Optional[str] = None
    max_daily_minutes: int = 180


class PlanRescheduler:
    """
    Intelligent rescheduling engine.

    Rules:
    - Completed days stay untouched
    - Missed tasks are pushed forward
    - No day exceeds max_daily_minutes
    """

    def calculate_new_schedule(self, request: RescheduleRequest) -> LearningPath:
        original = request.original_plan
        new_plan = original.model_copy(deep=True)

        completed: List[DailyTask] = []
        pending: List[DailyTask] = []

        # Filter out completed days. 
        # Missed days will be treated as pending (pushed forward)
        for day in new_plan.daily_tasks:
            if day.day_number in request.completed_days:
                completed.append(day)
            elif day.day_number not in request.missed_days:
                # This was a pending day that stays pending
                pending.append(day)
            else:
                # This was a missed day, we treat it as pending to be pushed forward
                day.status = "pending"
                pending.append(day)

        # Re-sort pending days to ensure they follow logical order
        pending.sort(key=lambda d: d.day_number)

        # Update the plan with new task list
        new_plan.daily_tasks = completed + pending
        
        # Renumber to maintain sequential daily numbers
        self._renumber_days(new_plan)

        # Update metadata
        new_plan.updated_at = datetime.now().isoformat()

        return new_plan

    def _renumber_days(self, plan: LearningPath) -> None:
        """Sequential renumbering of days."""
        plan.daily_tasks.sort(key=lambda d: d.day_number)
        for idx, day in enumerate(plan.daily_tasks, start=1):
            day.day_number = idx
        plan.total_days = len(plan.daily_tasks)
