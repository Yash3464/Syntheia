import os
import sys
from dotenv import load_dotenv

# Add root and backend to path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

load_dotenv()

def test_supabase():
    print("Testing Supabase Connection...")
    try:
        from database.connection import supabase
        if not supabase:
            print("❌ Supabase client failed to initialize (check .env).")
            return
            
        # Try to list rows in learning_paths (confirm table exists)
        res = supabase.table("learning_paths").select("count", count="exact").limit(1).execute()
        print(f"✅ Supabase connected. Found {res.count} existing paths.")
    except Exception as e:
        print(f"❌ Supabase Error: {e}")

def test_gemini():
    print("\nTesting Gemini Configuration...")
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("❌ GEMINI_API_KEY missing in .env.")
            return
            
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        # Just check if we can initialize, don't generate to save tokens
        print("✅ Gemini SDK initialized successfully.")
    except Exception as e:
        print(f"❌ Gemini Error: {e}")

if __name__ == "__main__":
    test_supabase()
    test_gemini()
