import os
import sys
from dotenv import load_dotenv
import traceback

# Add the project root to sys.path to import local modules
sys.path.append(os.getcwd())

load_dotenv()

def test_supabase():
    print("\n--- 🔍 Checking Supabase Connectivity ---")
    try:
        from database.connection import supabase
        if not supabase:
            print("🔴 Supabase client initialization failed.")
            return

        print("📡 Pinging Supabase...")
        res = supabase.table("profiles").select("count", count="exact").limit(1).execute()
        print(f"✅ Supabase connection successful! Found {res.count} profiles.")

        print("\n--- 🔍 Checking Table Schema: learning_paths ---")
        # Querying information_schema to see actual columns
        rpc_res = supabase.rpc("get_columns", {"table_name": "learning_paths"}).execute()
        if rpc_res.data:
            cols = [c.get('column_name') for c in rpc_res.data]
            print(f"✅ Found columns: {cols}")
        else:
            # Fallback if RPC doesn't exist
            print("⚠️ RPC 'get_columns' not found. Trying a raw query to check for missing columns...")
            try:
                supabase.table("learning_paths").select("actual_end_date").limit(1).execute()
                print("✅ 'actual_end_date' column exists.")
            except Exception as e:
                print(f"🔴 Mismatch detected: {e}")

    except Exception as e:
        print("🔴 Supabase Error:")
        print(traceback.format_exc())

def test_gemini():
    print("\n--- 🔍 Checking Gemini API ---")
    try:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("🔴 GEMINI_API_KEY is missing from .env")
            return
            
        genai.configure(api_key=api_key)
        
        print("📡 Listing available models...")
        models = genai.list_models()
        model_names = [m.name for m in models]
        print(f"✅ Found models: {model_names[:5]}...")
        
        test_model = "gemini-pro"
        if f"models/{test_model}" in model_names or test_model in model_names:
            print(f"✅ Model '{test_model}' is available.")
        else:
            print(f"⚠️ Model '{test_model}' NOT found. Recommendation: Use {model_names[0]}")

    except Exception as e:
        print("🔴 Gemini Error:")
        print(traceback.format_exc())

if __name__ == "__main__":
    test_supabase()
    test_gemini()
