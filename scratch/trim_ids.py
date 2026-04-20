from database.connection import supabase
import sys

def trim_all_plan_ids():
    print("🧹 Starting plan_id cleanup...")
    try:
        # Fetch all plans
        res = supabase.table('learning_paths').select('id', 'plan_id').execute()
        if not res.data:
            print("📭 No plans found to clean.")
            return

        for plan in res.data:
            pid = plan['id']
            old_plan_id = plan['plan_id']
            new_plan_id = old_plan_id.strip()
            
            if old_plan_id != new_plan_id:
                print(f"🔄 Trimming '{old_plan_id}' -> '{new_plan_id}'")
                supabase.table('learning_paths').update({'plan_id': new_plan_id}).eq('id', pid).execute()
            else:
                print(f"✅ ID already clean: '{old_plan_id}'")
                
        print("✨ Cleanup complete!")
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        sys.exit(1)

if __name__ == "__main__":
    trim_all_plan_ids()
