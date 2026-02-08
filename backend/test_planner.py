"""
Test script to verify the core planner functionality.
Run this to see the system in action.
"""

import json
from datetime import datetime

from app.core.planner import LearningPlanner
from app.core.rescheduler import PlanRescheduler, RescheduleRequest
from app.models.user import User, UserPreferences
from app.services.plan_service import PlanService


def test_basic_plan_generation():
    """Test generating a basic learning plan."""
    print("🧪 Testing Basic Plan Generation")
    print("=" * 60)
    
    # Create a test user
    user = User(
        username="test_user",
        email="test@example.com",
        experience_level="beginner",
        preferences=UserPreferences(
            daily_study_time_minutes=60,
            preferred_learning_style="visual"
        )
    )
    
    # Create plan service
    service = PlanService()
    
    # Generate a plan
    print("\n📝 Generating Python Beginner Plan (Medium Pace)...")
    plan = service.create_learning_path(
        user=user,
        module_id="python",
        level="beginner",
        pace="medium"
    )
    
    print(f"✅ Plan created: {plan.plan_id}")
    print(f"📊 Total days: {plan.total_days}")
    print(f"⏰ Total estimated hours: {plan.total_hours}")
    print(f"📅 Start date: {plan.start_date}")
    
    # Show first 3 days
    print("\n📅 First 3 days of the plan:")
    for day in plan.daily_tasks[:3]:
        print(f"\nDay {day.day_number}:")
        print(f"  Topics: {', '.join(day.topics)}")
        print(f"  Estimated time: {day.estimated_time_minutes} minutes")
        print(f"  Status: {day.status}")
    
    return plan


def test_rescheduling():
    """Test rescheduling a plan after missed days."""
    print("\n\n🧪 Testing Plan Rescheduling")
    print("=" * 60)
    
    # Create a test user and plan
    user = User(
        username="test_user2",
        email="test2@example.com",
        experience_level="beginner"
    )
    
    service = PlanService()
    plan = service.create_learning_path(user, "python", "beginner", "medium")
    
    print(f"\n📝 Original plan has {plan.total_days} days")
    
    # Simulate missing days 2 and 4
    print("\n⏰ User missed days 2 and 4")
    print("🔄 Rescheduling plan...")
    
    rescheduled_plan = service.reschedule_plan(
        plan_id=plan.plan_id,
        missed_days=[2, 4]
    )
    
    if rescheduled_plan:
        print(f"✅ Rescheduled plan has {rescheduled_plan.total_days} days")
        
        # Show changes
        print("\n📊 Comparison:")
        original_day_topics = {
            day.day_number: day.topics 
            for day in plan.daily_tasks[:5]
        }
        new_day_topics = {
            day.day_number: day.topics 
            for day in rescheduled_plan.daily_tasks[:5]
        }
        
        for day_num in range(1, 6):
            if day_num in original_day_topics and day_num in new_day_topics:
                print(f"Day {day_num}:")
                print(f"  Original: {original_day_topics[day_num]}")
                print(f"  New: {new_day_topics[day_num]}")
    
    return rescheduled_plan


def test_progress_tracking():
    """Test progress tracking and AI recommendations."""
    print("\n\n🧪 Testing Progress Tracking")
    print("=" * 60)
    
    user = User(
        username="progress_user",
        email="progress@example.com",
        experience_level="intermediate"
    )
    
    service = PlanService()
    plan = service.create_learning_path(user, "python", "intermediate", "medium")
    
    # Mark some days as completed
    print("\n✅ Marking days 1, 2, and 3 as completed...")
    service.mark_day_completed(plan.plan_id, 1, 65)
    service.mark_day_completed(plan.plan_id, 2, 70)
    service.mark_day_completed(plan.plan_id, 3, 80)
    
    # Get progress
    progress = service.get_plan_progress(plan.plan_id)
    
    if progress:
        print(f"\n📊 Progress Report:")
        print(f"  Completion: {progress['completion_percentage']}%")
        print(f"  Days completed: {progress['completed_days']}/{progress['total_days']}")
        print(f"  Current streak: {progress['current_streak']} days")
        
        print(f"\n🤖 AI Recommendations:")
        for rec in progress['recommendations']:
            print(f"  • {rec}")
        
        print(f"\n🎯 Pace Suggestion:")
        print(f"  Current pace: {progress['pace_suggestion']['current_pace']}")
        print(f"  Suggested pace: {progress['pace_suggestion']['suggested_pace']}")
        print(f"  Reason: {progress['pace_suggestion']['rationale']}")


def test_module_information():
    """Test retrieving module information."""
    print("\n\n🧪 Testing Module Information")
    print("=" * 60)
    
    service = PlanService()
    modules = service.get_available_modules()
    
    print("\n📚 Available Learning Modules:")
    for module in modules:
        print(f"\n{module['name']} ({module['id']}):")
        print(f"  Description: {module['description']}")
        for level, info in module['levels'].items():
            print(f"  {level.title()}: {info['topics']} topics, {info['hours']} hours")


def main():
    """Run all tests."""
    print("🚀 Syntheia Backend System Test")
    print("=" * 60)
    
    # Run all tests
    test_basic_plan_generation()
    test_rescheduling()
    test_progress_tracking()
    test_module_information()
    
    print("\n" + "=" * 60)
    print("✅ All tests completed successfully!")
    print("\n🎉 Your backend is ready to use!")
    print("\nTo start the API server:")
    print("  cd backend")
    print("  uvicorn app.main:app --reload")
    print("\nThen visit http://localhost:8000/docs for API documentation")


if __name__ == "__main__":
    main()