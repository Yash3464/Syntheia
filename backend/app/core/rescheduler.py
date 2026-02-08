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

        # Deep copy so original plan remains unchanged
        new_plan = original.model_copy(deep=True)

        completed: List[DailyTask] = []
        missed: List[DailyTask] = []
        pending: List[DailyTask] = []

        # Split days
        for day in new_plan.daily_tasks:
            if day.day_number in request.completed_days:
                completed.append(day)
            elif day.day_number in request.missed_days:
                missed.append(day)
            else:
                pending.append(day)

        # Collect missed topic IDs
        missed_topic_ids: List[str] = []
        for day in missed:
            missed_topic_ids.extend(day.topic_ids)

        # Redistribute missed topics
        self._redistribute_tasks(
            plan=new_plan,
            missed_topic_ids=missed_topic_ids,
            pending_days=pending,
            max_daily_minutes=request.max_daily_minutes
        )

        # Remove missed days completely
        new_plan.daily_tasks = completed + pending

        # Renumber days
        self._renumber_days(new_plan)

        # Update metadata
        new_plan.updated_at = datetime.now().isoformat()

        return new_plan

    def _redistribute_tasks(
        self,
        plan: LearningPath,
        missed_topic_ids: List[str],
        pending_days: List[DailyTask],
        max_daily_minutes: int
    ) -> None:
        if not missed_topic_ids:
            return

        from app.core.modules import get_module

        module = get_module(plan.module_id)
        if not module:
            raise ValueError(f"Module '{plan.module_id}' not found")

        # Build topic lookup
        topic_map: Dict[str, Any] = {}
        for level_name in ["beginner", "intermediate", "advanced"]:
            level = getattr(module, level_name, None)
            if level:
                for topic in level.topics:
                    topic_map[topic.id] = topic

        # Assign missed topics
        for topic_id in missed_topic_ids:
            topic = topic_map.get(topic_id)
            if not topic:
                continue

            placed = False

            for day in pending_days:
                if day.estimated_time_minutes + topic.estimated_time <= max_daily_minutes:
                    day.topic_ids.append(topic_id)
                    day.topics.append(topic.title)
                    day.estimated_time_minutes += topic.estimated_time
                    day.notes += f" | Rescheduled: {topic.title}"
                    placed = True
                    break

            # Create catch-up day if needed
            if not placed:
                new_day = DailyTask(
                    day_number=len(plan.daily_tasks) + 1,
                    topics=[topic.title],
                    topic_ids=[topic_id],
                    estimated_time_minutes=topic.estimated_time,
                    status="pending",
                    notes=f"Catch-up for missed topic: {topic.title}"
                )
                plan.daily_tasks.append(new_day)
                pending_days.append(new_day)

    def _renumber_days(self, plan: LearningPath) -> None:
        plan.daily_tasks.sort(key=lambda d: d.day_number)
        for idx, day in enumerate(plan.daily_tasks, start=1):
            day.day_number = idx
        plan.total_days = len(plan.daily_tasks)
