"""
Plan Service - Orchestrates plan generation, rescheduling, and tracking.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime

from app.core.planner import LearningPlanner
from app.core.rescheduler import PlanRescheduler, RescheduleRequest
from app.core.ai_integration import AIEnhancer
from app.models.learning_path import LearningPath, DailyTask
from app.models.user import User


class PlanService:
    """
    Service layer for managing learning plans.
    Coordinates between core logic and data models.
    """
    
    def __init__(self):
        self.planner = LearningPlanner()
        self.rescheduler = PlanRescheduler()
        self.ai_enhancer = AIEnhancer()
        self.active_plans: Dict[str, LearningPath] = {}
    
    def create_learning_path(
        self,
        user: User,
        module_id: str,
        level: Optional[str] = None,
        pace: Optional[str] = None
    ) -> LearningPath:
        """
        Create a new learning path for a user.
        
        Args:
            user: User object
            module_id: Learning module ID
            level: Override user's level if provided
            pace: Learning pace (if not provided, uses user preferences)
        
        Returns:
            LearningPath object
        """
        # Use provided level or user's level
        target_level = level or user.experience_level
        
        # Use provided pace or calculate from preferences
        if pace:
            target_pace = pace
        else:
            # Calculate pace based on daily study time
            if user.preferences.daily_study_time_minutes <= 45:
                target_pace = "slow"
            elif user.preferences.daily_study_time_minutes <= 90:
                target_pace = "medium"
            else:
                target_pace = "fast"
        
        # Generate plan
        plan = self.planner.generate_plan(
            module_id=module_id,
            level=target_level,
            pace=target_pace,
            user_id=user.id
        )
        
        # Convert to LearningPath model
        learning_path = LearningPath(
            user_id=user.id or "anonymous",
            plan_id=plan.plan_id,
            module_id=module_id,
            level=target_level,
            pace=target_pace,
            start_date=plan.start_date,
            total_days=plan.total_days,
            total_hours=plan.total_hours,
            daily_tasks=[
                DailyTask(
                    day_number=task.day_number,
                    topics=task.topics,
                    topic_ids=task.topic_ids,
                    estimated_time_minutes=task.estimated_time_minutes,
                    status=task.status
                )
                for task in plan.daily_plans
            ]
        )
        
        # Calculate target end date (rough estimate)
        if learning_path.total_days > 0:
            from datetime import datetime, timedelta
            start = datetime.strptime(learning_path.start_date, "%Y-%m-%d")
            target_end = start + timedelta(days=learning_path.total_days + 7)  # +7 days buffer
            learning_path.target_end_date = target_end.strftime("%Y-%m-%d")
        
        # Store in active plans (in production, this would be in a database)
        self.active_plans[learning_path.plan_id] = learning_path
        
        return learning_path
    
    def reschedule_plan(
        self,
        plan_id: str,
        missed_days: List[int],
        completed_days: Optional[List[int]] = None,
        new_pace: Optional[str] = None
    ) -> Optional[LearningPath]:
        """
        Reschedule a learning plan.
        
        Args:
            plan_id: ID of the plan to reschedule
            missed_days: List of day numbers that were missed
            completed_days: List of completed days
            new_pace: Optional new pace for the plan
        
        Returns:
            Updated LearningPath or None if not found
        """
        if plan_id not in self.active_plans:
            return None
        
        original_plan = self.active_plans[plan_id]
        
        # Create reschedule request
        request = RescheduleRequest(
            original_plan=original_plan,
            missed_days=missed_days,
            completed_days=completed_days or [],
            new_pace=new_pace
        )
        
        # Reschedule
        updated_plan = self.rescheduler.calculate_new_schedule(request)
        
        # Update stored plan
        self.active_plans[plan_id] = updated_plan
        self.active_plans[plan_id].updated_at = datetime.now().isoformat()
        
        return updated_plan
    
    def get_plan_progress(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """
        Get progress statistics for a plan.
        
        Returns:
            Dictionary with progress metrics
        """
        if plan_id not in self.active_plans:
            return None
        
        plan = self.active_plans[plan_id]
        plan.update_progress()
        
        # Calculate streak
        streak = 0
        for task in sorted(plan.daily_tasks, key=lambda x: x.day_number):
            if task.status == "completed":
                streak += 1
            else:
                break
        
        # Get AI recommendations
        recommendations = self.ai_enhancer.get_personalized_recommendations(
            plan.module_id,
            plan.level
        )
        
        # Get pace adjustment suggestion
        pace_suggestion = self.ai_enhancer.suggest_pace_adjustment(
            plan.completion_percentage,
            plan.pace
        )
        
        return {
            "plan_id": plan_id,
            "module": plan.module_id,
            "level": plan.level,
            "pace": plan.pace,
            "total_days": plan.total_days,
            "completed_days": plan.completed_days,
            "completion_percentage": plan.completion_percentage,
            "current_streak": streak,
            "start_date": plan.start_date,
            "is_active": plan.is_active,
            "recommendations": recommendations[:3],  # Top 3 recommendations
            "pace_suggestion": pace_suggestion
        }
    
    def mark_day_completed(
        self,
        plan_id: str,
        day_number: int,
        actual_time_minutes: Optional[int] = None
    ) -> bool:
        """
        Mark a day as completed.
        
        Returns:
            True if successful, False otherwise
        """
        if plan_id not in self.active_plans:
            return False
        
        plan = self.active_plans[plan_id]
        plan.mark_day_completed(day_number, actual_time_minutes)
        return True
    
    def get_available_modules(self) -> List[Dict[str, Any]]:
        """Get list of available learning modules."""
        from app.core.modules import MODULES
        
        modules = []
        for module_id, module in MODULES.items():
            modules.append({
                "id": module_id,
                "name": module.name,
                "description": module.description,
                "levels": {
                    "beginner": {
                        "topics": len(module.beginner.topics),
                        "hours": module.beginner.total_estimated_hours
                    },
                    "intermediate": {
                        "topics": len(module.intermediate.topics),
                        "hours": module.intermediate.total_estimated_hours
                    },
                    "advanced": {
                        "topics": len(module.advanced.topics),
                        "hours": module.advanced.total_estimated_hours
                    }
                }
            })
        
        return modules