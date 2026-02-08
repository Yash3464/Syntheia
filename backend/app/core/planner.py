"""
Learning Plan Generator
Creates personalized day-by-day learning plans based on module, level, and pace.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field, validator

from .modules import LearningModule, get_module, get_level_topics


class DailyTask(BaseModel):
    """Represents a single day's learning tasks."""
    day_number: int
    date: Optional[str] = None  # Optional date string
    topics: List[str]
    topic_ids: List[str]
    estimated_time_minutes: int
    status: str = "pending"  # pending, completed, missed
    notes: str = ""


class LearningPlan(BaseModel):
    """Complete learning plan for a user."""
    plan_id: str = Field(default_factory=lambda: f"plan_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
    user_id: Optional[str] = None
    module_id: str
    level: str  # beginner, intermediate, advanced
    pace: str  # slow, medium, fast
    start_date: str = Field(default_factory=lambda: datetime.now().strftime('%Y-%m-%d'))
    total_days: int = 0
    total_hours: float = 0.0
    daily_plans: List[DailyTask] = []
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class LearningPlanner:
    """
    Core planner that generates personalized learning paths.
    
    Design Philosophy:
    1. Beginner: Gentle pace, focus on fundamentals
    2. Intermediate: Balanced theory and practice
    3. Advanced: Faster pace, assumes prior knowledge
    4. Pace adjusts daily workload, not skipping concepts
    """
    
    # Pace configuration: topics per day based on level and pace
    PACING_RULES = {
        "beginner": {
            "slow": {"topics_per_day": 1, "max_minutes_per_day": 60},
            "medium": {"topics_per_day": 2, "max_minutes_per_day": 90},
            "fast": {"topics_per_day": 3, "max_minutes_per_day": 120}
        },
        "intermediate": {
            "slow": {"topics_per_day": 1, "max_minutes_per_day": 75},
            "medium": {"topics_per_day": 2, "max_minutes_per_day": 120},
            "fast": {"topics_per_day": 3, "max_minutes_per_day": 150}
        },
        "advanced": {
            "slow": {"topics_per_day": 1, "max_minutes_per_day": 90},
            "medium": {"topics_per_day": 2, "max_minutes_per_day": 150},
            "fast": {"topics_per_day": 3, "max_minutes_per_day": 180}
        }
    }
    
    def __init__(self):
        self.available_modules = ["python"]  # Will be expanded
    
    def validate_input(self, module_id: str, level: str, pace: str) -> Dict[str, Any]:
        """Validate planning inputs."""
        errors = []
        
        if module_id not in self.available_modules:
            errors.append(f"Module '{module_id}' not available. Choose from: {self.available_modules}")
        
        valid_levels = ["beginner", "intermediate", "advanced"]
        if level not in valid_levels:
            errors.append(f"Invalid level '{level}'. Must be one of: {valid_levels}")
        
        valid_paces = ["slow", "medium", "fast"]
        if pace not in valid_paces:
            errors.append(f"Invalid pace '{pace}'. Must be one of: {valid_paces}")
        
        return {"valid": len(errors) == 0, "errors": errors}
    
    def calculate_daily_topics(self, topics: List[Any], level: str, pace: str) -> List[List[Any]]:
        """
        Group topics into daily chunks based on level and pace.
        
        Strategy:
        - Ensure prerequisites are respected
        - Balance daily workload
        - Group related topics when possible
        """
        pacing = self.PACING_RULES[level][pace]
        topics_per_day = pacing["topics_per_day"]
        max_minutes = pacing["max_minutes_per_day"]
        
        daily_chunks = []
        current_chunk = []
        current_minutes = 0
        
        for topic in topics:
            # Check if adding this topic would exceed daily limits
            if (len(current_chunk) >= topics_per_day or 
                current_minutes + topic.estimated_time > max_minutes):
                
                if current_chunk:
                    daily_chunks.append(current_chunk)
                
                current_chunk = [topic]
                current_minutes = topic.estimated_time
            else:
                current_chunk.append(topic)
                current_minutes += topic.estimated_time
        
        # Add the last chunk if it exists
        if current_chunk:
            daily_chunks.append(current_chunk)
        
        return daily_chunks
    
    def generate_plan(
        self, 
        module_id: str, 
        level: str, 
        pace: str,
        user_id: Optional[str] = None
    ) -> LearningPlan:
        """
        Generate a complete learning plan.
        
        Args:
            module_id: The learning module (e.g., 'python')
            level: User's current level (beginner/intermediate/advanced)
            pace: Learning pace (slow/medium/fast)
            user_id: Optional user identifier
        
        Returns:
            LearningPlan object with daily schedule
        """
        # Validate inputs
        validation = self.validate_input(module_id, level, pace)
        if not validation["valid"]:
            raise ValueError(f"Invalid inputs: {validation['errors']}")
        
        # Get module and topics
        module = get_module(module_id)
        if not module:
            raise ValueError(f"Module '{module_id}' not found")
        
        topics = get_level_topics(module_id, level)
        if not topics:
            raise ValueError(f"No topics found for {module_id} - {level}")
        
        # Group topics into daily chunks
        daily_topic_chunks = self.calculate_daily_topics(topics, level, pace)
        
        # Create daily plans
        daily_plans = []
        total_minutes = 0
        
        for day_num, topic_chunk in enumerate(daily_topic_chunks, 1):
            daily_minutes = sum(topic.estimated_time for topic in topic_chunk)
            total_minutes += daily_minutes
            
            daily_plans.append(DailyTask(
                day_number=day_num,
                topics=[topic.title for topic in topic_chunk],
                topic_ids=[topic.id for topic in topic_chunk],
                estimated_time_minutes=daily_minutes,
                status="pending",
                notes=f"Day {day_num}: {', '.join([topic.title for topic in topic_chunk])}"
            ))
        
        # Calculate total hours
        total_hours = round(total_minutes / 60, 1)
        
        # Create the complete plan
        plan = LearningPlan(
            user_id=user_id,
            module_id=module_id,
            level=level,
            pace=pace,
            total_days=len(daily_plans),
            total_hours=total_hours,
            daily_plans=daily_plans
        )
        
        return plan
    
    def get_plan_summary(self, plan: LearningPlan) -> Dict[str, Any]:
        """Get a summary of the learning plan."""
        return {
            "plan_id": plan.plan_id,
            "module": plan.module_id,
            "level": plan.level,
            "pace": plan.pace,
            "total_days": plan.total_days,
            "total_hours": plan.total_hours,
            "start_date": plan.start_date,
            "daily_breakdown": [
                {
                    "day": task.day_number,
                    "topics": task.topics,
                    "estimated_time": f"{task.estimated_time_minutes} min"
                }
                for task in plan.daily_plans[:5]  # Show first 5 days
            ]
        }