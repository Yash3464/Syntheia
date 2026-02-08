"""
Application constants and configuration.
"""

# Learning levels
LEVELS = ["beginner", "intermediate", "advanced"]

# Learning paces
PACES = ["slow", "medium", "fast"]

# Available modules
AVAILABLE_MODULES = ["python"]

# Status codes for tasks
TASK_STATUS = {
    "PENDING": "pending",
    "IN_PROGRESS": "in_progress",
    "COMPLETED": "completed",
    "MISSED": "missed",
    "SKIPPED": "skipped"
}

# Learning styles
LEARNING_STYLES = ["visual", "auditory", "kinesthetic", "mixed"]

# Difficulty levels
DIFFICULTY_LEVELS = ["easy", "medium", "hard"]

# Default configuration
DEFAULT_CONFIG = {
    "max_daily_minutes": 180,
    "min_daily_minutes": 30,
    "max_topics_per_day": 4,
    "streak_buffer_days": 3,
    "completion_threshold": 70  # Percentage for "on track"
}

# API Response messages
RESPONSE_MESSAGES = {
    "PLAN_CREATED": "Learning plan created successfully",
    "PLAN_UPDATED": "Learning plan updated successfully",
    "PLAN_NOT_FOUND": "Learning plan not found",
    "INVALID_INPUT": "Invalid input parameters",
    "RESCHEDULE_SUCCESS": "Plan rescheduled successfully"
}