import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
    console.warn("Supabase credentials missing or set to placeholder. Please update your .env file.");
    // We keep it as null to let the app handle the failure or use dummy data if needed, 
    // but the Mock logic is now removed as per user request for "real" Supabase.
    supabase = null;
} else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

function ensureSupabase() {
    if (!supabase) {
        throw new Error(
            'Supabase client is not initialized. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
        );
    }
    return supabase;
}

export { supabase, ensureSupabase };