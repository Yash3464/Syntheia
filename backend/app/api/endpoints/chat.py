from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

api_key = os.getenv("GEMINI_API_KEY", "")

# Try lighter/higher-quota models first, then fall back to heavier ones
GEMINI_MODELS = [
    "gemini-1.5-flash-8b",   # Highest free-tier RPM
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
]

class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    app_context: Optional[Dict] = None
    system_prompt: Optional[str] = "You are Syntheia, an encouraging, highly knowledgeable AI programming tutor. Keep your answers concise, clear, and easy to read. Use code blocks when needed."

class ChatResponse(BaseModel):
    response: str
    error: Optional[str] = None


async def call_gemini_rest(model: str, contents: list, system_instruction: str) -> str:
    """Call Gemini via direct REST API — no gRPC, no heavy SDK."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    payload = {
        "system_instruction": {"parts": [{"text": system_instruction}]},
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1024,
        }
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        
    # Extract text from response
    candidate = data.get("candidates", [{}])[0]
    parts = candidate.get("content", {}).get("parts", [{}])
    return parts[0].get("text", "")


@router.post("/tutor", response_model=ChatResponse)
async def chat_tutor(request: ChatRequest):
    if not api_key:
        return ChatResponse(
            response="I'm a mock AI tutor! To unlock real conversations, please add `GEMINI_API_KEY` to your Vercel environment variables."
        )

    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided.")

    try:
        # Build system instruction from context
        system_instruction = request.system_prompt or "You are Syntheia, a helpful AI tutor."
        if request.app_context:
            ctx = request.app_context
            plan_info = f"The user is on a {ctx.get('level', 'unknown')} level path for {ctx.get('module_id', 'programming')}. "
            if ctx.get('activePlan'):
                plan = ctx['activePlan']
                completed = plan.get('completed_days', 0) if isinstance(plan, dict) else getattr(plan, 'completed_days', 0)
                total = plan.get('total_days', 0) if isinstance(plan, dict) else getattr(plan, 'total_days', 0)
                plan_info += f"They have completed {completed} out of {total} days. "
            system_instruction += f"\n\nCONTEXTUAL DATA:\n{plan_info}\nCurrent screen: {ctx.get('screen', 'dashboard')}"

        # Build contents array for REST API
        contents = []
        for msg in request.messages:
            role = "user" if msg.role == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg.content}]})

        # Try each model in order
        response_text = None
        last_error = None

        for model_name in GEMINI_MODELS:
            try:
                print(f"🤖 Trying Gemini REST API with model: {model_name}")
                response_text = await call_gemini_rest(model_name, contents, system_instruction)
                if response_text:
                    print(f"✅ Success with {model_name}")
                    break
            except httpx.HTTPStatusError as e:
                last_error = f"HTTP {e.response.status_code}: {e.response.text[:200]}"
                print(f"⚠️ Model {model_name} failed: {last_error}")
                if e.response.status_code == 429:
                    break  # Rate limited — no point trying other models immediately
                continue
            except Exception as e:
                last_error = str(e)
                print(f"⚠️ Model {model_name} failed: {last_error}")
                continue

        if not response_text:
            raise Exception(f"All models failed. Last error: {last_error}")

        return ChatResponse(response=response_text)

    except Exception as e:
        import traceback
        error_msg = str(e)
        print(f"❌ Gemini API Error:")
        print(traceback.format_exc())

        if "429" in error_msg:
            return ChatResponse(
                response="I'm helping a lot of students right now! Please give me about 60 seconds to catch my breath, then ask me your question again. 🚀",
                error=error_msg
            )
        if "404" in error_msg:
            return ChatResponse(
                response="Syntheia's neural nodes for the assigned model version are temporarily unavailable. Please ask me again in a moment.",
                error=error_msg
            )
        if "400" in error_msg and "API_KEY" in error_msg.upper():
            return ChatResponse(
                response="The Gemini API key appears invalid. Please check GEMINI_API_KEY in your Vercel environment variables.",
                error=error_msg
            )

        return ChatResponse(
            response="I hit a small snag while thinking. Could you try asking that again? I'm ready!",
            error=error_msg
        )
