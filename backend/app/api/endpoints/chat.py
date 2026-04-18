from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

api_key = os.getenv("GEMINI_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)

class ChatMessage(BaseModel):
    role: str # "user" or "model"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system_prompt: Optional[str] = "You are an encouraging, highly knowledgeable AI programming tutor. Keep your answers concise, clear, and easy to read. Use code blocks when needed."

class ChatResponse(BaseModel):
    response: str
    error: Optional[str] = None

@router.post("/tutor", response_model=ChatResponse)
async def chat_tutor(request: ChatRequest):
    if not api_key:
        return ChatResponse(
            response="I'm a mock AI tutor! To unlock real conversations, please add `GEMINI_API_KEY` to your backend `.env` file."
        )

    try:
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=request.system_prompt)
        
        # Format history for Gemini
        formatted_history = []
        for msg in request.messages[:-1]:
            role = "user" if msg.role == "user" else "model"
            formatted_history.append({"role": role, "parts": [{"text": msg.content}]})

        chat = model.start_chat(history=formatted_history)
        
        if not request.messages:
            raise HTTPException(status_code=400, detail="No messages provided.")
            
        latest_message = request.messages[-1].content
        response = await chat.send_message_async(latest_message)

        return ChatResponse(response=response.text)
    except Exception as e:
        print("Gemini API Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
