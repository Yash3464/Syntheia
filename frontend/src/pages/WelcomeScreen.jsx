import { useApp } from '../context/AppContext';
import './Welcome.css';

const features = [
  { icon: '⚡', label: 'Adaptive Plans', desc: 'Personalized to your pace' },
  { icon: '↺', label: 'Smart Reschedule', desc: 'Missed a day? No panic.' },
  { icon: '◎', label: 'Progress Tracking', desc: 'See your streak grow' },
  { icon: '✦', label: 'AI Ready', desc: 'Smart insights coming soon' },
];

export default function WelcomeScreen() {
  const { navigate } = useApp();

  return (
    <div className="welcome-screen screen">
      <div className="welcome-grid">
        <div className="welcome-left">
          <div className="welcome-logo">
            <div className="logo-mark">S</div>
            <span>SYNTHEIA</span>
          </div>
          <div className="welcome-headline">
            <div className="headline-eyebrow mono">Your Learning Navigator</div>
            <h1 className="headline-text">
              LEARN <br />
              <span className="headline-accent">SMARTER.</span>
              <br />NOT HARDER.
            </h1>
            <p className="welcome-desc">
              An AI-powered system that builds your personal learning path,
              adapts when life happens, and keeps you on track — every single day.
            </p>
          </div>
          <div className="welcome-cta">
            <button className="btn btn-primary" onClick={() => navigate('onboarding')}>
              Get Started →
            </button>
            <span className="mono text-gray" style={{ fontSize: '0.8rem' }}>Free · No account needed yet</span>
          </div>
        </div>

        <div className="welcome-right">
          <div className="welcome-card-stack">
            <div className="hero-stat-card">
              <div className="stat-number">Day 12</div>
              <div className="stat-label mono">Current Streak 🔥</div>
              <div className="progress-bar" style={{ marginTop: 12 }}>
                <div className="progress-bar-fill" style={{ width: '72%' }} />
              </div>
              <div className="mono text-gray" style={{ fontSize: '0.75rem', marginTop: 6 }}>72% complete · Python Beginner</div>
            </div>

            <div className="feature-grid">
              {features.map(f => (
                <div key={f.label} className="feature-chip">
                  <span className="feature-icon">{f.icon}</span>
                  <div>
                    <div className="feature-name">{f.label}</div>
                    <div className="feature-desc mono">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="daily-preview">
              <div className="mono text-gray" style={{ fontSize: '0.7rem', marginBottom: 12 }}>TODAY'S PLAN</div>
              {['Python Functions', 'List Comprehensions'].map((t, i) => (
                <div key={t} className={`task-row ${i === 0 ? 'done' : ''}`}>
                  <span className="task-check">{i === 0 ? '✓' : '○'}</span>
                  <span className="task-name">{t}</span>
                  <span className="mono text-gray" style={{ fontSize: '0.75rem' }}>45 min</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}