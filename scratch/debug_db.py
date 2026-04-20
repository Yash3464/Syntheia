import os
from database.connection import supabase
from dotenv import load_dotenv

load_dotenv()

def debug_supabase():
    if not supabase:
        print("🔴 Supabase client not initialized")
        return

    print("🔍 Checking Learning Paths table...")
    try:
        res = supabase.table("learning_paths").select("plan_id, user_id, module_id").execute()
        if res.data:
            print(f"✅ Found {len(res.data)} plans:")
            for p in res.data:
                print(f"   - Plan ID: {p['plan_id']} | User: {p['user_id']} | Module: {p['module_id']}")
        else:
            print("❓ No plans found in the database.")
    except Exception as e:
        print(f"🔴 Error querying Supabase: {e}")

if __name__ == "__main__":
    debug_supabase()
