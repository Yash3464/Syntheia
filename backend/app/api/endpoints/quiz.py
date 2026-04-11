from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any

from app.services.quiz_service import QuizService

router = APIRouter()
quiz_service = QuizService()

@router.get("/questions")
async def get_quiz_questions(topics: str, count: int = 3):
    topic_list = topics.split(",")
    questions = quiz_service.get_quiz_for_topics(topic_list, count)
    return questions

@router.post("/submit")
async def submit_quiz(answers: List[Dict[str, Any]]):
    result = quiz_service.evaluate_quiz(answers)
    return result