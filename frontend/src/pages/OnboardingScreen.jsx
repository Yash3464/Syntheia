import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import './Onboarding.css';

const STEPS = [
  { id: 'profile', label: '01', title: 'Who are you?' },
  { id: 'skills',  label: '02', title: 'What do you want to learn?' },
  { id: 'pace',    label: '03', title: 'How do you learn?' },
];

const MODULES = [
  { id: 'python', name: 'Python', icon: '🐍', desc: 'Programming fundamentals to advanced' },
  { id: 'machine_learning', name: 'Machine Learning', icon: '🤖', desc: 'Coming soon', disabled: true },
  { id: 'web_development',  name: 'Web Dev', icon: '🌐', desc: 'Coming soon', disabled: true },
  { id: 'sql', name: 'SQL & Databases', icon: '🗄️', desc: 'Coming soon', disabled: true },
];

const INTERESTS = ['AI', 'Web Dev', 'Data Science', 'Backend', 'DevOps', 'Mobile', 'Security', 'Open Source'];

const PACES = [
  { id: 'slow',   label: 'Relaxed', desc: '~40 min/day', detail: 'Steady and thorough' },
  { id: 'medium', label: 'Balanced', desc: '~60 min/day', detail: 'Best for most learners' },
  { id: 'fast',   label: 'Intense',  desc: '~90 min/day', detail: 'For the committed' },
];

const LEVELS = [
  { id: 'beginner',     label: 'Beginner',     desc: 'Just starting out' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Know the basics' },
  { id: 'advanced',     label: 'Advanced',     desc: 'Want mastery' },
];

export default function OnboardingScreen() {
  const { dispatch, navigate } = useApp();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    username: '', email: '', full_name: '',
    experience_level: 'beginner',
    module_id: 'python',
    interests: [],
    pace: 'medium',
    daily_study_time_minutes: 60,
    current_goal: '',
  });

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const toggleInterest = (i) => setForm(prev => ({
    ...prev,
    interests: prev.interests.includes(i)
      ? prev.interests.filter(x => x !== i)
      : [...prev.interests, i],
  }));

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const user = {
        username: form.username || 'learner',
        email: form.email || 'learner@syntheia.app',
        full_name: form.full_name || null,
        experience_level: form.experience_level,
        current_goal: form.current_goal || null,
        preferences: {
          preferred_learning_style: 'mixed',
          daily_study_time_minutes: form.daily_study_time_minutes,
          preferred_difficulty: 'balanced',
          notifications_enabled: true,
          email_updates: false,
        },
      };
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_PROFILE', payload: { module_id: form.module_id, pace: form.pace, interests: form.interests } });
      const plan = await api.createLearningPath(user, form.module_id, form.experience_level, form.pace);
      dispatch({ type: 'SET_PLAN', payload: plan });
      navigate('plan-preview');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboard-screen screen">
      <div className="onboard-header">
        <button className="btn btn-ghost" onClick={() => step === 0 ? navigate('welcome') : setStep(s => s - 1)}>← Back</button>
        <div className="onboard-steps">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`onboard-step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              {i < step ? '✓' : s.label}
            </div>
          ))}
        </div>
        <div className="mono text-gray" style={{ fontSize: '0.75rem' }}>{step + 1} / {STEPS.length}</div>
      </div>

      <div className="onboard-content">
        <div className="onboard-title-row">
          <div className="mono text-yellow" style={{ fontSize: '0.75rem', letterSpacing: '0.15em' }}>STEP {STEPS[step].label}</div>
          <h2 className="onboard-title">{STEPS[step].title}</h2>
        </div>

        {step === 0 && (
          <div className="onboard-form">
            <div className="field">
              <label>Your Name (optional)</label>
              <input placeholder="e.g. Alex" value={form.full_name} onChange={e => updateForm('full_name', e.target.value)} />
            </div>
            <div className="field">
              <label>Username</label>
              <input placeholder="e.g. alexlearns" value={form.username} onChange={e => updateForm('username', e.target.value)} />
            </div>
            <div className="field">
              <label>Email (optional)</label>
              <input type="email" placeholder="your@email.com" value={form.email} onChange={e => updateForm('email', e.target.value)} />
            </div>
            <div className="field">
              <label>What's your learning goal?</label>
              <input placeholder="e.g. Get a job in data science" value={form.current_goal} onChange={e => updateForm('current_goal', e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onboard-form">
            <div className="field">
              <label>Pick a module</label>
              <div className="module-grid">
                {MODULES.map(m => (
                  <button
                    key={m.id}
                    className={`module-card ${form.module_id === m.id ? 'selected' : ''} ${m.disabled ? 'disabled' : ''}`}
                    onClick={() => !m.disabled && updateForm('module_id', m.id)}
                    disabled={m.disabled}
                  >
                    <span className="module-icon">{m.icon}</span>
                    <span className="module-name">{m.name}</span>
                    <span className="module-desc mono">{m.desc}</span>
                    {m.disabled && <span className="badge badge-gray" style={{ fontSize: '0.6rem' }}>Soon</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Your current level</label>
              <div className="option-row">
                {LEVELS.map(l => (
                  <button key={l.id} className={`option-btn ${form.experience_level === l.id ? 'selected' : ''}`} onClick={() => updateForm('experience_level', l.id)}>
                    <span className="option-label">{l.label}</span>
                    <span className="option-desc mono">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Interests (optional)</label>
              <div className="interest-wrap">
                {INTERESTS.map(i => (
                  <button key={i} className={`interest-tag ${form.interests.includes(i) ? 'selected' : ''}`} onClick={() => toggleInterest(i)}>{i}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboard-form">
            <div className="field">
              <label>Choose your pace</label>
              <div className="pace-grid">
                {PACES.map(p => (
                  <button
                    key={p.id}
                    className={`pace-card ${form.pace === p.id ? 'selected' : ''}`}
                    onClick={() => { updateForm('pace', p.id); updateForm('daily_study_time_minutes', p.id === 'slow' ? 40 : p.id === 'medium' ? 60 : 90); }}
                  >
                    <span className="pace-label">{p.label}</span>
                    <span className="pace-desc text-yellow mono">{p.desc}</span>
                    <span className="pace-detail mono">{p.detail}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="pace-explainer card card-accent">
              <div className="mono text-gray" style={{ fontSize: '0.75rem', marginBottom: 8 }}>HOW PACE WORKS</div>
              <p style={{ color: 'var(--gray-5)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                Pace controls your daily study load — not what you learn. Same topics, different speed. You can always change it later.
              </p>
            </div>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        <button className="btn btn-primary onboard-next" onClick={handleNext} disabled={loading}>
          {loading ? 'Building your plan...' : step === STEPS.length - 1 ? 'Generate My Plan →' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}