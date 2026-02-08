"""
Helper functions for the Syntheia backend.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta


def validate_learning_input(
    module: str, 
    level: str, 
    pace: str
) -> Dict[str, Any]:
    """
    Validate learning plan input parameters.
    
    Returns:
        Dict with 'valid' boolean and 'errors' list
    """
    from .constants import LEVELS, PACES, AVAILABLE_MODULES
    
    errors = []
    
    if module not in AVAILABLE_MODULES:
        errors.append(f"Module '{module}' not available. Choose from: {AVAILABLE_MODULES}")
    
    if level not in LEVELS:
        errors.append(f"Level '{level}' not valid. Choose from: {LEVELS}")
    
    if pace not in PACES:
        errors.append(f"Pace '{pace}' not valid. Choose from: {PACES}")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }


def calculate_pace_adjustment(
    completion_rate: float,
    current_pace: str,
    user_feedback: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calculate if pace should be adjusted.
    
    Args:
        completion_rate: Percentage of tasks completed (0-100)
        current_pace: Current learning pace
        user_feedback: Optional user feedback about difficulty
    
    Returns:
        Dict with pace suggestion and rationale
    """
    pace_order = ["slow", "medium", "fast"]
    
    if completion_rate >= 90:
        # Doing great - consider increasing pace
        current_idx = pace_order.index(current_pace)
        if current_idx < len(pace_order) - 1:
            new_pace = pace_order[current_idx + 1]
            rationale = "Excellent completion rate! You might be ready for a faster pace."
        else:
            new_pace = current_pace
            rationale = "Maintain your current excellent pace."
    
    elif completion_rate >= 70:
        # On track - maintain current pace
        new_pace = current_pace
        rationale = "Good progress. Your current pace seems appropriate."
    
    elif completion_rate >= 50:
        # Struggling - consider slowing down
        current_idx = pace_order.index(current_pace)
        if current_idx > 0:
            new_pace = pace_order[current_idx - 1]
            rationale = "Consider slowing down to improve understanding."
        else:
            new_pace = current_pace
            rationale = "Focus on mastering current topics before moving on."
    
    else:
        # Struggling significantly - slow down
        new_pace = "slow"
        rationale = "Let's slow down to ensure solid understanding of fundamentals."
    
    # Override with user feedback if provided
    if user_feedback:
        if "too fast" in user_feedback.lower():
            new_pace = "slow"
            rationale = "Based on your feedback, let's slow down the pace."
        elif "too slow" in user_feedback.lower():
            new_pace = "fast"
            rationale = "Based on your feedback, let's increase the pace."
    
    return {
        "suggested_pace": new_pace,
        "current_pace": current_pace,
        "completion_rate": completion_rate,
        "rationale": rationale,
        "adjustment_needed": new_pace != current_pace
    }


def format_learning_time(minutes: int) -> str:
    """Format minutes into a readable time string."""
    if minutes < 60:
        return f"{minutes} minutes"
    else:
        hours = minutes // 60
        remaining_minutes = minutes % 60
        if remaining_minutes == 0:
            return f"{hours} hour{'s' if hours > 1 else ''}"
        else:
            return f"{hours} hour{'s' if hours > 1 else ''} {remaining_minutes} minutes"


def generate_plan_id() -> str:
    """Generate a unique plan ID."""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    import random
    random_suffix = ''.join(random.choices('0123456789abcdef', k=6))
    return f"plan_{timestamp}_{random_suffix}"


def calculate_end_date(start_date: str, total_days: int, buffer_days: int = 7) -> str:
    """Calculate target end date with buffer."""
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end_date = start + timedelta(days=total_days + buffer_days)
    return end_date.strftime("%Y-%m-%d")