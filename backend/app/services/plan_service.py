"""
Plan Service - Orchestrates plan generation, rescheduling, and tracking via Supabase.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json
import os

from app.core.planner import LearningPlanner
from app.core.rescheduler import PlanRescheduler, RescheduleRequest
from app.core.ai_integration import AIEnhancer
from app.models.learning_path import LearningPath, DailyTask
from app.models.user import User
from database.connection import supabase


class PlanService:
    """
    Service layer for managing learning plans.
    Persists data to Supabase PostgreSQL.
    """
    
    def __init__(self):
        self.planner = LearningPlanner()
        self.rescheduler = PlanRescheduler()
        self.ai_enhancer = AIEnhancer()

    def create_learning_path(
        self,
        user: User,
        module_id: str,
        level: Optional[str] = None,
        pace: Optional[str] = None
    ) -> LearningPath:
        """
        Create a new learning path and persist to Supabase.
        """
        target_level = level or user.experience_level
        
        if pace:
            target_pace = pace
        else:
            if user.preferences.daily_study_time_minutes <= 45:
                target_pace = "slow"
            elif user.preferences.daily_study_time_minutes <= 90:
                target_pace = "medium"
            else:
                target_pace = "fast"
        
        # Generate plan using core logic
        plan = self.planner.generate_plan(
            module_id=module_id,
            level=target_level,
            pace=target_pace,
            user_id=user.id
        )
        
        # Determine target end date
        start = datetime.strptime(plan.start_date, "%Y-%m-%d")
        target_end = start + timedelta(days=plan.total_days + 7)
        
        # Create model
        learning_path = LearningPath(
            user_id=user.id or "anonymous",
            plan_id=plan.plan_id,
            module_id=module_id,
            level=target_level,
            pace=target_pace,
            start_date=plan.start_date,
            target_end_date=target_end.strftime("%Y-%m-%d"),
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
        
        # Persist to Supabase
        if supabase:
            try:
                # Validate UUID for Supabase compatibility
                import uuid
                try:
                    uuid.UUID(str(learning_path.user_id))
                except ValueError:
                    print(f"⚠️  Invalid UUID for user_id: '{learning_path.user_id}'. Cannot save to Supabase.")
                    return learning_path

                data = learning_path.model_dump()
                # Remove fields that have DB defaults or might cause schema cache issues
                # on first insert if the table was recently updated.
                data.pop('id', None) # Let DB generate UUID
                data.pop('completed_days', None)
                data.pop('completion_percentage', None)
                data.pop('is_active', None)
                
                print(f"📊 Attempting to save plan {learning_path.plan_id} to Supabase...")
                res = supabase.table("learning_paths").insert(data).execute()
                print(f"✅ Plan saved successfully to Supabase.")
            except Exception as e:
                import traceback
                print("🔴 Supabase Save Error:")
                print(traceback.format_exc())
                # Re-raise so the API layer can return a 500 with details
                raise Exception(f"Database save failed: {str(e)}")
        
        return learning_path
    
    def get_user_plan(self, user_id: str) -> Optional[LearningPath]:
        """Fetch the most recent active plan for a user from Supabase."""
        if not supabase:
            return None
            
        try:
            response = supabase.table("learning_paths") \
                .select("*") \
                .eq("user_id", user_id) \
                .eq("is_active", True) \
                .order("updated_at", desc=True) \
                .limit(1) \
                .execute()
            
            if response.data:
                return LearningPath(**response.data[0])
        except Exception as e:
            print(f"Error fetching user plan: {e}")
            
        return None

    def _find_plan(self, identifier: str) -> Optional[LearningPath]:
        """Internal helper to find a plan by either plan_id or internal UUID."""
        if not supabase or not identifier:
            return None
        
        # Rule-based cleaning
        clean_id = str(identifier).strip()
        
        try:
            # 1. Try exact plan_id match
            res = supabase.table("learning_paths").select("*").eq("plan_id", clean_id).execute()
            if res.data:
                return LearningPath(**res.data[0])
            
            # 2. Try fuzzy plan_id match (in case of legacy trailing spaces in DB)
            res = supabase.table("learning_paths").select("*").ilike("plan_id", f"{clean_id}%").execute()
            if res.data:
                # Find the one that matches after stripping
                for row in res.data:
                    if row['plan_id'].strip() == clean_id:
                        return LearningPath(**row)
            
            # 3. Try by internal UUID (id)
            import uuid
            try:
                uuid.UUID(clean_id)
                res = supabase.table("learning_paths").select("*").eq("id", clean_id).execute()
                if res.data:
                    return LearningPath(**res.data[0])
            except ValueError:
                pass
        except Exception as e:
            print(f"Error finding plan with identifier {clean_id}: {e}")
            
        return None

    def get_learning_path(self, plan_id: str) -> Optional[LearningPath]:
        """Fetch a specific learning path by its ID (plan_id or UUID) from Supabase."""
        return self._find_plan(plan_id)

    def mark_day_completed(
        self,
        plan_id: str,
        day_number: int,
        actual_time_minutes: Optional[int] = None,
        plan_obj: Optional[LearningPath] = None
    ) -> LearningPath:
        """
        Mark a day as completed. 
        If plan_obj is provided, it uses it directly (Disconnected Mode).
        Fallback: Fetches from Supabase if plan_obj is None.
        """
        # 1. DISCONNECTED BYPASS: If object provided, skip DB entirely
        plan = None
        if plan_obj:
            plan = plan_obj
        else:
            plan = self._find_plan(plan_id)
            
        if not plan:
            raise ValueError(f"Plan not found for ID: {plan_id}")
            
        plan.mark_day_completed(day_number, actual_time_minutes)
        
        # Sync back to Supabase as a background-friendly side effect
        if supabase:
            try:
                supabase.table("learning_paths") \
                    .update({
                        "daily_tasks": [t.model_dump() for t in plan.daily_tasks],
                        "completed_days": plan.completed_days,
                        "completion_percentage": plan.completion_percentage,
                        "updated_at": datetime.now().isoformat()
                    }) \
                    .eq("plan_id", plan.plan_id) \
                    .execute()
                print(f"✅ Sync complete for plan {plan.plan_id}")
            except Exception as e:
                print(f"⚠️ Background sync failed (Silent): {e}")
                
        return plan

    def reschedule_plan(
        self,
        plan_id: str,
        missed_days: List[int],
        completed_days: Optional[List[int]] = None,
        new_pace: Optional[str] = None,
        plan_obj: Optional[LearningPath] = None,
        shift_days: int = 0
    ) -> Optional[LearningPath]:
        """
        Reschedule a plan.
        If plan_obj is provided, it uses it directly (Disconnected Mode).
        """
        try:
            original_plan = plan_obj or self._find_plan(plan_id)
            if not original_plan:
                return None
                
            request = RescheduleRequest(
                original_plan=original_plan,
                missed_days=missed_days,
                completed_days=completed_days or [],
                new_pace=new_pace,
                shift_days=shift_days
            )
            
            updated_plan = self.rescheduler.calculate_new_schedule(request)
            updated_plan.updated_at = datetime.now().isoformat()
            
            # Sync back to Supabase
            if supabase:
                try:
                    supabase.table("learning_paths") \
                        .update(updated_plan.model_dump()) \
                        .eq("plan_id", original_plan.plan_id) \
                        .execute()
                    print(f"✅ Sync complete (Reschedule) for {original_plan.plan_id}")
                except Exception as e:
                    print(f"⚠️ Background sync failed (Reschedule): {e}")
                
            return updated_plan
        except Exception as e:
            import traceback
            print("🔴 Reschedule Logic Error:")
            print(traceback.format_exc())
            return None

    def get_plan_progress(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """Get progress metrics, fetching state from Supabase."""
        if not supabase:
            return None
            
        try:
            plan = self._find_plan(plan_id)
            if not plan:
                return None
            plan.update_progress()
            
            # Calculate streak
            streak = 0
            for task in sorted(plan.daily_tasks, key=lambda x: x.day_number):
                if task.status == "completed":
                    streak += 1
                else: break
            
            recommendations = self.ai_enhancer.get_personalized_recommendations(
                plan.module_id, plan.level
            )
            
            pace_suggestion = self.ai_enhancer.suggest_pace_adjustment(
                plan.completion_percentage, plan.pace
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
                "recommendations": recommendations[:3],
                "pace_suggestion": pace_suggestion
            }
        except Exception as e:
            print(f"Error fetching progress: {e}")
            return None

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