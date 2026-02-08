"""
Learning Path API endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import User
from app.models.learning_path import LearningPath, TaskStatus
from app.services.plan_service import PlanService
from app.api.dependencies import get_plan_service

router = APIRouter()


@router.post("/", response_model=LearningPath, status_code=status.HTTP_201_CREATED)
async def create_learning_path(
    user: User,
    module_id: str,
    level: Optional[str] = None,
    pace: Optional[str] = None,
    plan_service: PlanService = Depends(get_plan_service)
):
    """
    Create a new personalized learning path.
    
    - **module_id**: Learning module (e.g., "python")
    - **level**: Override user level (beginner/intermediate/advanced)
    - **pace**: Learning pace (slow/medium/fast)
    """
    try:
        path = plan_service.create_learning_path(user, module_id, level, pace)
        return path
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating learning path: {str(e)}"
        )


@router.get("/{plan_id}", response_model=LearningPath)
async def get_learning_path(
    plan_id: str,
    plan_service: PlanService = Depends(get_plan_service)
):
    """Get a specific learning path by ID."""
    plan = plan_service.active_plans.get(plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning path with ID {plan_id} not found"
        )
    return plan


@router.post("/{plan_id}/reschedule", response_model=LearningPath)
async def reschedule_learning_path(
    plan_id: str,
    missed_days: List[int],
    completed_days: Optional[List[int]] = None,
    new_pace: Optional[str] = None,
    plan_service: PlanService = Depends(get_plan_service)
):
    """
    Reschedule a learning path after missed days.
    
    - **missed_days**: List of day numbers that were missed
    - **completed_days**: List of completed day numbers
    - **new_pace**: Optional new pace for the plan
    """
    updated_plan = plan_service.reschedule_plan(
        plan_id, missed_days, completed_days, new_pace
    )
    
    if not updated_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning path with ID {plan_id} not found"
        )
    
    return updated_plan


@router.get("/{plan_id}/progress")
async def get_plan_progress(
    plan_id: str,
    plan_service: PlanService = Depends(get_plan_service)
):
    """Get progress statistics for a learning path."""
    progress = plan_service.get_plan_progress(plan_id)
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning path with ID {plan_id} not found"
        )
    return progress


@router.post("/{plan_id}/days/{day_number}/complete")
async def mark_day_completed(
    plan_id: str,
    day_number: int,
    actual_time_minutes: Optional[int] = None,
    plan_service: PlanService = Depends(get_plan_service)
):
    """Mark a specific day as completed."""
    success = plan_service.mark_day_completed(
        plan_id, day_number, actual_time_minutes
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning path with ID {plan_id} not found"
        )
    
    return {"message": f"Day {day_number} marked as completed", "success": True}


@router.get("/modules/available")
async def get_available_modules(
    plan_service: PlanService = Depends(get_plan_service)
):
    """Get list of available learning modules."""
    modules = plan_service.get_available_modules()
    return {"modules": modules}