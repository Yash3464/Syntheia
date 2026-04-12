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
    case 'SET_PLAN':     return { ...state, activePlan: action.payload };
    case 'SET_PROGRESS': return { ...state, progress: action.payload };
    case 'SET_LOADING':  return { ...state, loading: action.payload };
    case 'SET_ERROR':    return { ...state, error: action.payload };
    case 'SET_INITIALIZED': return { ...state, initialized: true };
    case 'RESET':        return { ...initialState, initialized: true };
    default:             return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = (screen) => dispatch({ type: 'SET_SCREEN', payload: screen });

  useEffect(() => {
    // 1. Initial Session Check
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await handleUserLogin(session.user);
        } else {
          dispatch({ type: 'SET_INITIALIZED' });
        }
      } catch (err) {
        console.error('Session init error:', err);
        dispatch({ type: 'SET_INITIALIZED' });
      }
    };

    const handleUserLogin = async (user) => {
      dispatch({ type: 'SET_USER', payload: user });
      try {
        // Try to fetch active plan
        const plan = await api.getUserPlan(user.id);
        if (plan) {
          dispatch({ type: 'SET_PLAN', payload: plan });
          navigate('dashboard');
        } else {
          navigate('onboarding');
        }
      } catch (err) {
        console.warn('No active plan for user or error:', err);
        navigate('onboarding');
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