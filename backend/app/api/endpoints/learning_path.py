from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.models.user import User
from app.models.learning_path import LearningPath, TaskStatus
from app.services.plan_service import PlanService
from app.api.dependencies import get_plan_service

router = APIRouter()


class RescheduleBody(BaseModel):
    missed_days: List[int] = []
    completed_days: List[int] = []
    new_pace: Optional[str] = None
    plan_obj: Optional[LearningPath] = None
    shift_days: int = 0  # > 0 = shift-forward mode; 0 = requeue missed mode


@router.post("/", response_model=LearningPath, status_code=status.HTTP_201_CREATED)
async def create_learning_path(
    user: User,
    module_id: str,
    level: Optional[str] = None,
    pace: Optional[str] = None,
    plan_service: PlanService = Depends(get_plan_service)
):
    try:
        path = plan_service.create_learning_path(user, module_id, level, pace)
        return path
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        import traceback
        print(f"🔥 Critical Error in create_learning_path:")
        print(traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error: {str(e)}")


@router.get("/modules/available")
async def get_available_modules(plan_service: PlanService = Depends(get_plan_service)):
    return {"modules": plan_service.get_available_modules()}


@router.get("/{plan_id}", response_model=LearningPath)
async def get_learning_path(plan_id: str, plan_service: PlanService = Depends(get_plan_service)):
    plan = plan_service.get_learning_path(plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Plan {plan_id} not found")
    return plan


@router.get("/user/{user_id}", response_model=LearningPath)
async def get_user_plan(user_id: str, plan_service: PlanService = Depends(get_plan_service)):
    plan = plan_service.get_user_plan(user_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No active plan found for user {user_id}")
    return plan


@router.post("/{plan_id}/reschedule", response_model=LearningPath)
async def reschedule_learning_path(
    plan_id: str,
    body: RescheduleBody,
    plan_service: PlanService = Depends(get_plan_service)
):
    updated = plan_service.reschedule_plan(
        plan_id, body.missed_days, body.completed_days, body.new_pace, body.plan_obj,
        shift_days=body.shift_days
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Plan {plan_id} not found")
    return updated


@router.get("/{plan_id}/progress")
async def get_plan_progress(plan_id: str, plan_service: PlanService = Depends(get_plan_service)):
    progress = plan_service.get_plan_progress(plan_id)
    if not progress:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Plan {plan_id} not found")
    return progress


@router.post("/{plan_id}/days/{day_number}/complete", response_model=LearningPath)
async def mark_day_completed(
    plan_id: str,
    day_number: int,
    body: Optional[LearningPath] = None,
    actual_time_minutes: Optional[int] = None,
    plan_service: PlanService = Depends(get_plan_service)
):
    """
    Mark a day as complete. Accepts optional full plan object for 'code-based' resolution.
    """
    try:
        updated_plan = plan_service.mark_day_completed(plan_id, day_number, actual_time_minutes, body)
        return updated_plan
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))