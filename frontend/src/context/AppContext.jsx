import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext(null);

const initialState = {
  screen: 'splash',
  user: null,
  profile: null,
  activePlan: null,
  progress: null,
  loading: false,
  error: null,
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
    case 'RESET':        return initialState;
    default:             return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = (screen) => dispatch({ type: 'SET_SCREEN', payload: screen });

  return (
    <AppContext.Provider value={{ state, dispatch, navigate }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}