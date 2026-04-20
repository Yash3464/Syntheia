
import os
import google.generativeai as genai
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def test_supabase():
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("❌ Supabase credentials missing")
        return
    
    try:
        supabase = create_client(url, key)
        res = supabase.table("profiles").select("*").limit(1).execute()
        print(f"✅ Supabase connection successful. Profile count: {len(res.data)}")
    except Exception as e:
        print(f"❌ Supabase error: {e}")

def test_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ Gemini API key missing")
        return
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content("Hello, respond with 'Syntheia Online'")
        print(f"✅ Gemini response: {response.text.strip()}")
    except Exception as e:
        print(f"❌ Gemini error: {e}")

if __name__ == "__main__":
    print("--- Diagnostic Test ---")
    test_supabase()
    test_gemini()
