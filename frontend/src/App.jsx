import { AppProvider, useApp } from './context/AppContext';
import SplashScreen from './pages/SplashScreen';
import WelcomeScreen from './pages/WelcomeScreen';
import AuthScreen from './pages/AuthScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import PlanPreviewScreen from './pages/PlanPreviewScreen';
import DashboardScreen from './pages/DashboardScreen';
import CalendarViewScreen from './pages/CalendarViewScreen';
import ProgressScreen from './pages/ProgressScreen';
import RescheduleScreen from './pages/RescheduleScreen';
import TutorScreen from './pages/TutorScreen';
import './styles/globals.css';

function Router() {
  const { state } = useApp();

  if (!state.initialized || state.screen === 'splash') {
    return <SplashScreen />;
  }

  switch (state.screen) {
    case 'welcome': return <WelcomeScreen />;
    case 'auth': return <AuthScreen />;
    case 'onboarding': return <OnboardingScreen />;
    case 'plan-preview': return <PlanPreviewScreen />;
    case 'dashboard': return <DashboardScreen />;
    case 'calendar': return <CalendarViewScreen />;
    case 'progress': return <ProgressScreen />;
    case 'reschedule': return <RescheduleScreen />;
    case 'tutor': return <TutorScreen />;
    default: return <WelcomeScreen />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}