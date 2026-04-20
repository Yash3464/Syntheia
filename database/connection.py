import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# We use the Service Role Key in the backend to ensure the API can 
# manage plans reliably regardless of user-specific session state.
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def get_supabase_client() -> Client:
    """
    Returns an initialized Supabase client.
    Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in .env.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("⚠️  Warning: Supabase credentials missing. DB operations will fail.")
        return None
        
    return create_client(SUPABASE_URL, SUPABASE_KEY)

# Singleton instance
supabase: Client = get_supabase_client()
