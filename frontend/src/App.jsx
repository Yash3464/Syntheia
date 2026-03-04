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
import './styles/globals.css';

function Router() {
  const { state } = useApp();

  switch (state.screen) {
    case 'splash': return <SplashScreen />;
    case 'welcome': return <WelcomeScreen />;
    case 'auth': return <AuthScreen />;
    case 'onboarding': return <OnboardingScreen />;
    case 'plan-preview': return <PlanPreviewScreen />;
    case 'dashboard': return <DashboardScreen />;
    case 'calendar': return <CalendarViewScreen />;
    case 'progress': return <ProgressScreen />;
    case 'reschedule': return <RescheduleScreen />;
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