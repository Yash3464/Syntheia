from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

def get_api_key() -> str:
    # Try Groq first, fallback to Gemini if they still want it
    return os.getenv("GROQ_API_KEY", "").strip() or os.getenv("GEMINI_API_KEY", "").strip()

# We will use Groq's newest standard model
GROQ_MODEL = "llama-3.1-8b-instant"

@router.get("/debug-key")
async def debug_key():
    """Diagnostic: confirms the API key prefix and tests the Groq model."""
    api_key = get_api_key()
    key_preview = f"{api_key[:8]}..." if len(api_key) >= 8 else f"[{len(api_key)} chars]"
    
    if not api_key:
        return {"key_present": False, "key_preview": "EMPTY", "status": "No GROQ_API_KEY found"}

    is_groq = api_key.startswith("gsk_")
    results = {}

    if is_groq:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": "Hi"}],
                "max_tokens": 10
            }
            try:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    results[GROQ_MODEL] = "✅ HTTP 200 OK (Groq is working!)"
                else:
                    results[GROQ_MODEL] = f"❌ HTTP {resp.status_code}: {resp.text[:200]}"
            except Exception as ex:
                results[GROQ_MODEL] = f"🔥 ERROR: {str(ex)[:120]}"
    else:
        results["gemini"] = "⚠️ Using a Gemini key, but system is now optimized for Groq. Please get a Groq key (gsk_...)"

    return {"key_present": True, "key_preview": key_preview, "provider": "Groq" if is_groq else "Legacy (Gemini)", "models": results}

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

@router.post("/tutor", response_model=ChatResponse)
async def chat_tutor(request: ChatRequest):
    api_key = get_api_key()
    key_preview = f"{api_key[:8]}..." if len(api_key) >= 8 else f"[{len(api_key)} chars]"
    print(f"🔑 API_KEY prefix: {key_preview}")
    
    if not api_key or not api_key.startswith("gsk_"):
        return ChatResponse(
            response="I am running in Mock Mode! To unlock real AI conversations, please add a `GROQ_API_KEY` to your Vercel environment variables. Get a free key at https://console.groq.com/keys"
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

        # Build contents array for OpenAI/Groq spec
        # Groq uses "assistant" instead of "model"
        formatted_messages = [{"role": "system", "content": system_instruction}]
        
        for msg in request.messages:
            role = "user" if msg.role == "user" else "assistant"
            formatted_messages.append({"role": role, "content": msg.content})

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": GROQ_MODEL,
            "messages": formatted_messages,
            "temperature": 0.7,
            "max_tokens": 1024,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            
            if resp.status_code != 200:
                raise Exception(f"Groq API Error (HTTP {resp.status_code}): {resp.text[:300]}")
                
            data = resp.json()
            
        response_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        if not response_text:
            raise Exception("Received empty response from Groq.")

        return ChatResponse(response=response_text)

    except Exception as e:
        import traceback
        error_msg = str(e)
        print(f"❌ AI API Error:")
        print(traceback.format_exc())

        if "429" in error_msg:
            return ChatResponse(
                response="I'm helping a lot of students right now! Please give me a minute to catch my breath, then ask again. 🚀",
                error=error_msg
            )

        if "API key rejected" in error_msg:
            return ChatResponse(
                response="⚠️ The Groq API key is invalid or expired. Please check `GROQ_API_KEY` in Vercel.",
                error=error_msg
            )

        return ChatResponse(
            response=f"⚠️ AI Error (check Vercel logs): {error_msg[:300]}",
            error=error_msg
        )
