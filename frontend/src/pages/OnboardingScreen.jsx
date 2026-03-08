import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { supabase } from '../lib/supabaseClient';
import './Onboarding.css';

const STEPS = [
  { id: 'profile', label: '01', title: 'Who are you?' },
  { id: 'skills', label: '02', title: 'What do you want to learn?' },
  { id: 'pace', label: '03', title: 'How do you learn?' },
];

const MODULES = [
  { id: 'python', name: 'Python', icon: '🐍', desc: 'Programming fundamentals to advanced' },
  { id: 'machine_learning', name: 'Machine Learning', icon: '🤖', desc: 'Coming soon', disabled: true },
  { id: 'web_development', name: 'Web Dev', icon: '🌐', desc: 'Coming soon', disabled: true },
  { id: 'sql', name: 'SQL & Databases', icon: '🗄️', desc: 'Coming soon', disabled: true },
];

const LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'Just starting out' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Know the basics' },
  { id: 'advanced', label: 'Advanced', desc: 'Want mastery' },
];

const PACES = [
  { id: 'slow', label: 'Relaxed', desc: '~40 min/day', detail: 'Steady and thorough' },
  { id: 'medium', label: 'Balanced', desc: '~60 min/day', detail: 'Best for most learners' },
  { id: 'fast', label: 'Intense', desc: '~90 min/day', detail: 'For the committed' },
];

const INTERESTS = ['AI', 'Web Dev', 'Data Science', 'Backend', 'DevOps', 'Mobile', 'Security', 'Open Source'];

export default function OnboardingScreen() {
  const { dispatch, navigate, signOut } = useApp();
  const [step, setStep] = useState(0);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [learningGoal, setLearningGoal] = useState('');

  const [moduleId, setModuleId] = useState('python');
  const [level, setLevel] = useState('beginner');
  const [pace, setPace] = useState('medium');
  const [interests, setInterests] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
  }, [step]);

  const toggleInterest = (interest) => {
    setInterests((prev) => (prev.includes(interest) ? prev.filter((x) => x !== interest) : [...prev, interest]));
  };

  const requireAuthUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    const user = data?.user ?? null;
    if (!user) {
      navigate('auth');
      throw new Error('Please sign in first.');
    }
    return user;
  };

  const saveProfileToSupabase = async (authUser) => {
    const payload = {
      id: authUser.id,
      email: (email || authUser.email || '').trim() || null,
      full_name: fullName?.trim() || null,
      username: username?.trim() || null,
      learning_goal: learningGoal?.trim() || null,
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
  };

  const handleContinue = async () => {
    try {
      if (step === 0) {
        if (!username.trim()) {
          setError('Username is required.');
          return;
        }
        await requireAuthUser();
      }
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    } catch (e) {
      setError(e?.message || 'Unknown error');
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');

    try {
      const authUser = await requireAuthUser();
      await saveProfileToSupabase(authUser);

      const user = {
        id: authUser.id,
        username: username || 'learner',
        email: email || authUser.email || 'learner@syntheia.app',
        full_name: fullName || null,
        experience_level: level,
        current_goal: learningGoal || null,
        preferences: {
          preferred_learning_style: 'mixed',
          daily_study_time_minutes: pace === 'slow' ? 40 : pace === 'fast' ? 90 : 60,
          preferred_difficulty: 'balanced',
          notifications_enabled: true,
          email_updates: false,
        },
      };

      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_PROFILE', payload: { module_id: moduleId, pace, interests } });

      const plan = await api.createLearningPath(user, moduleId, level, pace);
      dispatch({ type: 'SET_PLAN', payload: plan });
      navigate('plan-preview');
    } catch (e) {
      setError(e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboard-screen screen">
      <div className="onboard-header">
        <button className="btn btn-ghost" onClick={() => (step === 0 ? navigate('welcome') : setStep((s) => s - 1))}>
          ← Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div className="onboard-steps">
            {STEPS.map((s, i) => (
              <div key={s.id} className={`onboard-step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                {i < step ? '✓' : s.label}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="mono text-gray" style={{ fontSize: '0.75rem' }}>
              {step + 1} / {STEPS.length}
            </div>
            <button className="btn btn-ghost mono" onClick={signOut} style={{ fontSize: '0.7rem', color: '#ff6b6b' }}>Sign Out</button>
          </div>
        </div>
      </div>

      <div className="onboard-body">
        {step === 0 && (
          <div className="onboard-content">
            <div className="onboard-title-row">
              <div className="onboard-step-label">STEP 01</div>
              <h1 className="onboard-title">WHO ARE YOU?</h1>
            </div>

            <form className="onboard-form" onSubmit={(e) => { e.preventDefault(); handleContinue(); }}>
              <div className="onboard-field">
                <label className="onboard-label">YOUR NAME (OPTIONAL)</label>
                <input className="onboard-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Alex" autoComplete="name" />
              </div>

              <div className="onboard-field">
                <label className="onboard-label">USERNAME</label>
                <input className="onboard-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. alexlearns" />
              </div>

              <div className="onboard-field">
                <label className="onboard-label">EMAIL (OPTIONAL)</label>
                <input className="onboard-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" />
              </div>

              <div className="onboard-field">
                <label className="onboard-label">WHAT'S YOUR LEARNING GOAL?</label>
                <input className="onboard-input" value={learningGoal} onChange={(e) => setLearningGoal(e.target.value)} placeholder="e.g. Get a job in data science" />
              </div>

              <button type="submit" className="onboard-cta">
                CONTINUE →
              </button>
            </form>
          </div>
        )}

        {step === 1 && (
          <div className="onboard-content">
            <div className="onboard-title-row">
              <div className="onboard-step-label">STEP 02</div>
              <h1 className="onboard-title">WHAT DO YOU WANT TO LEARN?</h1>
            </div>

            <div className="module-grid">
              {MODULES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={m.disabled}
                  className={`module-card ${moduleId === m.id ? 'active' : ''} ${m.disabled ? 'disabled' : ''}`}
                  onClick={() => !m.disabled && setModuleId(m.id)}
                >
                  <div className="module-icon">{m.icon}</div>
                  <div className="module-name">{m.name}</div>
                  <div className="module-desc">{m.desc}</div>
                </button>
              ))}
            </div>

            <div className="level-row">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={`level-card ${level === l.id ? 'active' : ''}`}
                  onClick={() => setLevel(l.id)}
                >
                  <div className="level-label">{l.label}</div>
                  <div className="level-desc">{l.desc}</div>
                </button>
              ))}
            </div>

            <div className="interest-grid">
              {INTERESTS.map((i) => (
                <button key={i} type="button" className={`pill ${interests.includes(i) ? 'active' : ''}`} onClick={() => toggleInterest(i)}>
                  {i}
                </button>
              ))}
            </div>

            <button className="onboard-cta" onClick={handleContinue}>
              CONTINUE →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="onboard-content">
            <div className="onboard-title-row">
              <div className="onboard-step-label">STEP 03</div>
              <h1 className="onboard-title">HOW DO YOU LEARN?</h1>
            </div>

            <div className="pace-grid">
              {PACES.map((p) => (
                <button key={p.id} type="button" className={`pace-card ${pace === p.id ? 'active' : ''}`} onClick={() => setPace(p.id)}>
                  <div className="pace-label">{p.label}</div>
                  <div className="pace-desc">{p.desc}</div>
                  <div className="pace-detail">{p.detail}</div>
                </button>
              ))}
            </div>

            <button className="onboard-cta" onClick={handleFinish} disabled={loading}>
              {loading ? 'CREATING PLAN...' : 'GENERATE MY PLAN →'}
            </button>
          </div>
        )}

        {error ? <div className="onboard-error">{error}</div> : null}
      </div>
    </div>
  );
}