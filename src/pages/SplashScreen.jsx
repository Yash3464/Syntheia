import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './Splash.css';

export default function SplashScreen() {
  const { navigate } = useApp();

  useEffect(() => {
    const t = setTimeout(() => navigate('welcome'), 2800);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-logo">
        <div className="splash-mark"><span>S</span></div>
        <div className="splash-wordmark">SYNTHEIA</div>
        <div className="splash-tagline mono">AI Learning Navigator</div>
      </div>
      <div className="splash-loader">
        <div className="splash-loader-bar" />
      </div>
    </div>
  );
}