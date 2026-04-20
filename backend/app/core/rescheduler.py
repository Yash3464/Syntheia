"""
Plan Rescheduler — Simple, predictable day-shifting logic.

Strategy:
  - "Shift" mode: push all remaining pending days forward by N days (adds days to calendar)
  - "Missed" mode: mark selected days as missed and requeue them at the end of the sequence
  - Completed days are NEVER touched in either mode
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.learning_path import LearningPath, DailyTask


class RescheduleRequest(BaseModel):
    """
    Request payload for rescheduling a learning plan.
    
    - missed_days: day numbers the user missed (requeued at end)
    - completed_days: day numbers already completed (never touched)
    - new_pace: unused currently, kept for API compatibility
    - shift_days: if > 0, push all pending days forward by this many slots
    """
    original_plan: LearningPath
    missed_days: List[int] = []
    completed_days: List[int] = []
    new_pace: Optional[str] = None
    max_daily_minutes: int = 180
    shift_days: int = 0  # How many extra days to shift forward (0 = no shift)


class PlanRescheduler:
    """
    Clean rescheduling engine with two modes:

    1. SHIFT MODE (shift_days > 0):
       - Inserts `shift_days` blank rest days before the next pending day
       - Total days increases by shift_days
       - Sequence is perfectly preserved — only pushed forward
       - Use case: "I can't study today/tomorrow, push everything forward"

    2. MISSED MODE (missed_days provided):
       - Marks selected days as 'missed'
       - Their topics are appended to the END of the plan as new catch-up days
       - Completed days stay untouched, other pending days keep their slots
       - Use case: "I missed specific days, add them at the end"
    """

    def calculate_new_schedule(self, request: RescheduleRequest) -> LearningPath:
        original = request.original_plan
        new_plan = original.model_copy(deep=True)

        if request.shift_days > 0:
            return self._shift_forward(new_plan, request.shift_days, request.completed_days)
        else:
            return self._requeue_missed(new_plan, request.missed_days, request.completed_days)

    def _shift_forward(
        self, plan: LearningPath, shift_by: int, completed_day_numbers: List[int]
    ) -> LearningPath:
        """
        Push all pending days forward by inserting `shift_by` rest/buffer day objects
        BEFORE the first pending day. Since the calendar renders dates as start_date + index,
        adding physical tasks at the right array position is the only way to shift dates.
        Completed days stay untouched. Total_days increases by shift_by.
        """
        all_tasks = [t.model_copy(deep=True) for t in plan.daily_tasks]

        # Separate completed and pending
        completed = [t for t in all_tasks
                     if t.day_number in completed_day_numbers or t.status == "completed"]
        pending   = [t for t in all_tasks
                     if t.day_number not in completed_day_numbers and t.status != "completed"]

        for t in completed:
            t.status = "completed"
        pending.sort(key=lambda d: d.day_number)

        # Create buffer "rest" days — one for each shift day
        first_pending_num = pending[0].day_number if pending else (
            (max(t.day_number for t in completed) if completed else 0) + 1
        )
        buffer_days = []
        for i in range(shift_by):
            buffer_days.append(DailyTask(
                day_number=0,          # renumbered below
                topic_ids=[],
                topics=["Rest / Buffer Day"],
                estimated_time_minutes=0,
                status="pending",
                notes="Automatically inserted buffer day from schedule shift",
                resources=[]
            ))

        # Re-assemble: completed → buffers → pending, then renumber
        new_tasks = completed + buffer_days + pending
        for idx, task in enumerate(new_tasks, start=1):
            task.day_number = idx

        return plan.model_copy(update={
            'daily_tasks': new_tasks,
            'total_days': len(new_tasks),
            'updated_at': datetime.now().isoformat()
        })

    def _requeue_missed(
        self, plan: LearningPath, missed_day_numbers: List[int], completed_day_numbers: List[int]
    ) -> LearningPath:
        """
        Mark missed days as 'missed' in their original slots, then clone
        their content as BRAND NEW days appended after the current last day.
        All other days (completed and pending) stay exactly where they are.
        Total increases by the number of missed days selected.
        """
        all_tasks = [t.model_copy(deep=True) for t in plan.daily_tasks]
        max_day = max((t.day_number for t in all_tasks), default=0)

        # Collect which tasks are being requeued (before modifying status)
        missed_tasks = sorted(
            [t for t in all_tasks if t.day_number in missed_day_numbers],
            key=lambda d: d.day_number
        )

        # Mark original slots as 'missed' in place
        for task in all_tasks:
            if task.day_number in missed_day_numbers:
                task.status = "missed"

        # Clone each missed task and append as a brand new day at the end
        next_day = max_day + 1
        new_days = []
        for task in missed_tasks:
            clone = task.model_copy(deep=True)
            clone.day_number = next_day
            clone.status = "pending"
            next_day += 1
            new_days.append(clone)

        final_tasks = sorted(all_tasks + new_days, key=lambda d: d.day_number)

        return plan.model_copy(update={
            'daily_tasks': final_tasks,
            'total_days': len(final_tasks),
            'updated_at': datetime.now().isoformat()
        })

    def _renumber_days(self, plan: LearningPath) -> None:
        """Sequential renumbering (kept for compatibility)."""
        plan.daily_tasks.sort(key=lambda d: d.day_number)
        for idx, day in enumerate(plan.daily_tasks, start=1):
            day.day_number = idx
        plan.total_days = len(plan.daily_tasks)
