import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.endsWith('placeholder_key')) {
  console.warn("Supabase environment variables are missing or use a placeholder. Using Mock Supabase Client for local development.");
  
  let authStateChangeListeners = [];

  // Mock Implementation for local development without Supabase
  supabase = {
    auth: {
      signUp: async ({ email, password }) => {
        const user = { id: 'mock-user-' + Date.now(), email };
        const session = { access_token: 'mock-token', user };
        localStorage.setItem('mockUser', JSON.stringify(user));
        authStateChangeListeners.forEach(cb => cb('SIGNED_IN', session));
        return { data: { user, session }, error: null };
      },
      signInWithPassword: async ({ email, password }) => {
        const user = { id: 'mock-user-123', email };
        const session = { access_token: 'mock-token', user };
        localStorage.setItem('mockUser', JSON.stringify(user));
        authStateChangeListeners.forEach(cb => cb('SIGNED_IN', session));
        return { data: { user, session }, error: null };
      },
      getUser: async () => {
        const user = JSON.parse(localStorage.getItem('mockUser'));
        return { data: { user }, error: user ? null : new Error("Not logged in") };
      },
      getSession: async () => {
        const user = JSON.parse(localStorage.getItem('mockUser'));
        return { data: { session: user ? { access_token: 'mock-token', user } : null }, error: null };
      },
      onAuthStateChange: (cb) => {
        // Trigger initial state
        const user = JSON.parse(localStorage.getItem('mockUser'));
        setTimeout(() => cb('INITIAL_SESSION', user ? { access_token: 'mock-token', user } : null), 0);
        authStateChangeListeners.push(cb);
        return { data: { subscription: { unsubscribe: () => {
          authStateChangeListeners = authStateChangeListeners.filter(l => l !== cb);
        } } } };
      },
      signOut: async () => {
        localStorage.removeItem('mockUser');
        authStateChangeListeners.forEach(cb => cb('SIGNED_OUT', null));
        return { error: null };
      }
    },
    from: (table) => ({
      upsert: async (data, options) => {
        console.log(`Mock insert into ${table}:`, data);
        return { data, error: null };
      }
    })
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase client is not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.local.'
    );
  }
  return supabase;
}

export { supabase, ensureSupabase };