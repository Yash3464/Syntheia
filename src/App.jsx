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
import AiAssistant from './components/AiAssistant';
import './styles/globals.css';

function Router() {
  const { state } = useApp();

  if (!state.initialized || state.screen === 'splash') {
    return <SplashScreen />;
  }

  const renderScreen = () => {
    switch (state.screen) {
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
  };

  // Only show the AI Tutor on main application screens (not Splash, Welcome, or Auth)
  const showAssistant = ['dashboard', 'calendar', 'progress', 'reschedule', 'onboarding', 'plan-preview'].includes(state.screen);

  return (
    <>
      {renderScreen()}
      {showAssistant && <AiAssistant />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}