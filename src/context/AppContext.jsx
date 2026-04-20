import { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { api } from '../services/api';

const AppContext = createContext(null);

const initialState = {
  screen: 'splash',
  user: null,
  profile: null,
  activePlan: null,
  progress: null,
  loading: false,
  error: null,
  initialized: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SCREEN':   return { ...state, screen: action.payload };
    case 'SET_USER':     return { ...state, user: action.payload };
    case 'SET_PROFILE':  return { ...state, profile: action.payload };
    case 'SET_PLAN':     
      if (action.payload) {
        localStorage.setItem('syntheia_active_plan', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('syntheia_active_plan');
      }
      return { ...state, activePlan: action.payload };
    case 'SET_PROGRESS': return { ...state, progress: action.payload };
    case 'SET_LOADING':  return { ...state, loading: action.payload };
    case 'SET_ERROR':    return { ...state, error: action.payload };
    case 'SET_INITIALIZED': return { ...state, initialized: true };
    case 'RESET':        
      localStorage.removeItem('syntheia_active_plan');
      return { ...initialState, initialized: true };
    default:             return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = (screen) => dispatch({ type: 'SET_SCREEN', payload: screen });

  useEffect(() => {
    if (!supabase) {
      console.error('Supabase client is not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      dispatch({ type: 'SET_INITIALIZED' });
      return;
    }

    // 1. Initial Session Check
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          console.log("♻️ Found existing session, logging in...");
          await handleUserLogin(session.user);
        } else {
          console.log("👋 No existing session found.");
          dispatch({ type: 'SET_INITIALIZED' });
        }
      } catch (err) {
        console.error('Session init error:', err);
        dispatch({ type: 'SET_INITIALIZED' });
      }
    };

    const handleUserLogin = async (user) => {
      dispatch({ type: 'SET_USER', payload: user });
      
      // 1. DISCONNECTED MODE: Check LocalStorage First for zero-latency load
      const localPlan = localStorage.getItem('syntheia_active_plan');
      if (localPlan) {
        try {
          const plan = JSON.parse(localPlan);
          console.log("📍 Disconnected Mode: Loaded plan from LocalStorage.");
          dispatch({ type: 'SET_PLAN', payload: plan });
          navigate('dashboard');
        } catch (e) {
          console.error("Failed to parse local plan:", e);
        }
      }

      try {
        console.log(`🔑 User ${user.email} logged in. Syncing state from cloud...`);
        
        // Fetch profile
        let profile = null;
        for (let i = 0; i < 3; i++) {
          const { data } = await supabase.table('profiles').select('*').eq('id', user.id).single();
          if (data) { profile = data; break; }
          if (i < 2) await new Promise(r => setTimeout(r, 1000));
        }
        if (profile) dispatch({ type: 'SET_PROFILE', payload: profile });

        // Sync fresh plan from cloud (if not already loaded or for background update)
        const cloudPlan = await api.getUserPlan(user.id);
        if (cloudPlan) {
          console.log(`☁️ Cloud plan synced: ${cloudPlan.plan_id}`);
          dispatch({ type: 'SET_PLAN', payload: cloudPlan });
          if (!localPlan) navigate('dashboard');
        } else if (!localPlan) {
          navigate('onboarding');
        }
      } catch (err) {
        if (!localPlan) navigate('onboarding');
      } finally {
        dispatch({ type: 'SET_INITIALIZED' });
      }
    };

    initSession();

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await handleUserLogin(session.user);
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'RESET' });
        navigate('welcome');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (!supabase) {
      console.error('Cannot sign out because Supabase client is not initialized.');
      return;
    }

    try {
      await supabase.auth.signOut();
      // onAuthStateChange handles the rest
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, navigate, signOut }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}