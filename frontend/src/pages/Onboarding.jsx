import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
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
  { id: 'fast',   label: 'Intense',  desc: '~90 min/day', detail: 'Fast-paced' },
];

export default function OnboardingScreen() {
  const { dispatch, navigate } = useApp();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    username: '', email: '', full_name: '',
    experience_level: 'beginner',
    module_id: 'python',
    interests: [],
    pace: 'medium',
    daily_study_time_minutes: 60,
    current_goal: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setError('Supabase client is not initialized. Please check your frontend environment variables.');
      return;
    }

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Supabase getUser error:', error);
        setSessionUser(null);
        return;
      }
      setSessionUser(data?.user ?? null);
    })();
  }, []);

  const toggleInterest = (interest) => {
    setForm((prev) => {
      const exists = prev.interests.includes(interest);
      return { ...prev, interests: exists ? prev.interests.filter(i => i !== interest) : [...prev.interests, interest] };
    });
  };

  const handleNext = () => {
    if (step === 0) {
      if (!form.username.trim()) return setError('Username is required.');
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized. Please check your frontend environment variables.');
      }

      // 1) Require Supabase Auth user (so profiles + user_id are real)
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const authUser = userRes?.user;
      if (!authUser) {
        throw new Error('You are not signed in. Please sign in first, then complete onboarding.');
      }

      // 2) Save profile in Supabase "profiles" table
      const profilePayload = {
        id: authUser.id,
        email: (form.email || authUser.email || '').trim() || null,
        full_name: form.full_name?.trim() || null,
        username: form.username?.trim() || null,
        learning_goal: form.current_goal?.trim() || null,
      };

      const { data: upsertData, error: upsertErr } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select('id');

      if (upsertErr) throw upsertErr;

      // 3) Build backend User model (matches backend app/models/user.py)
      const user = {
        id: authUser.id, // ✅ ensures backend returns user_id != "anonymous"
        username: form.username || 'learner',
        email: form.email || authUser.email || 'learner@syntheia.app',
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
      dispatch({
        type: 'SET_PROFILE',
        payload: { module_id: form.module_id, pace: form.pace, interests: form.interests },
      });

      // 4) Call backend to generate plan
      const plan = await api.createLearningPath(user, form.module_id, form.experience_level, form.pace);

      dispatch({ type: 'SET_PLAN', payload: plan });
      navigate('plan-preview');

      console.log('Supabase profile saved:', upsertData);
      console.log('Plan generated:', plan);
    } catch (e) {
      setError(e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboard-screen screen">
      <div className="onboard-header">
        <button className="btn btn-ghost" onClick={() => step === 0 ? navigate('welcome') : setStep(s => s - 1)}>
          ← Back
        </button>

        <div className="onboard-steps">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`onboard-step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              {i < step ? '✓' : s.label}
            </div>
          ))}
        </div>

        <div className="mono text-gray" style={{ fontSize: '0.75rem' }}>
          {step + 1} / {STEPS.length}
        </div>
      </div>

      <div style={{ padding: '0 24px', marginTop: 6, opacity: 0.75, fontSize: 12 }}>
        Auth user: {sessionUser ? (sessionUser.email || sessionUser.id) : 'NOT SIGNED IN'}
      </div>

      <div className="onboard-body">
        {step === 0 && (
          <div className="onboard-panel">
            <div className="onboard-step-label">STEP 01</div>
            <h1 className="onboard-title">WHO ARE YOU?</h1>

            <div className="onboard-field">
              <label className="onboard-label">YOUR NAME (OPTIONAL)</label>
              <input className="onboard-input" value={form.full_name}
                     onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                     placeholder="e.g. Alex" />
            </div>

            <div className="onboard-field">
              <label className="onboard-label">USERNAME</label>
              <input className="onboard-input" value={form.username}
                     onChange={(e) => setForm({ ...form, username: e.target.value })}
                     placeholder="e.g. alexlearns" required />
            </div>

            <div className="onboard-field">
              <label className="onboard-label">EMAIL (OPTIONAL)</label>
              <input className="onboard-input" value={form.email}
                     onChange={(e) => setForm({ ...form, email: e.target.value })}
                     placeholder="your@email.com" />
            </div>

            <div className="onboard-field">
              <label className="onboard-label">WHAT'S YOUR LEARNING GOAL?</label>
              <input className="onboard-input" value={form.current_goal}
                     onChange={(e) => setForm({ ...form, current_goal: e.target.value })}
                     placeholder="e.g. Get a job in data science" />
            </div>

            <button className="onboard-cta" onClick={handleNext}>CONTINUE →</button>
          </div>
        )}

        {step === 1 && (
          <div className="onboard-panel">
            <div className="onboard-step-label">STEP 02</div>
            <h1 className="onboard-title">WHAT DO YOU WANT TO LEARN?</h1>

            <div className="module-grid">
              {MODULES.map((m) => (
                <button
                  key={m.id}
                  disabled={m.disabled}
                  className={`module-card ${form.module_id === m.id ? 'active' : ''} ${m.disabled ? 'disabled' : ''}`}
                  onClick={() => !m.disabled && setForm({ ...form, module_id: m.id })}
                >
                  <div className="module-icon">{m.icon}</div>
                  <div className="module-name">{m.name}</div>
                  <div className="module-desc">{m.desc}</div>
                </button>
              ))}
            </div>

            <div className="interest-grid">
              {INTERESTS.map((i) => (
                <button
                  key={i}
                  className={`pill ${form.interests.includes(i) ? 'active' : ''}`}
                  onClick={() => toggleInterest(i)}
                >
                  {i}
                </button>
              ))}
            </div>

            <button className="onboard-cta" onClick={handleNext}>CONTINUE →</button>
          </div>
        )}

        {step === 2 && (
          <div className="onboard-panel">
            <div className="onboard-step-label">STEP 03</div>
            <h1 className="onboard-title">HOW DO YOU LEARN?</h1>

            <div className="pace-grid">
              {PACES.map((p) => (
                <button
                  key={p.id}
                  className={`pace-card ${form.pace === p.id ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, pace: p.id })}
                >
                  <div className="pace-label">{p.label}</div>
                  <div className="pace-desc">{p.desc}</div>
                  <div className="pace-detail">{p.detail}</div>
                </button>
              ))}
            </div>

            <button className="onboard-cta" onClick={handleSubmit} disabled={loading}>
              {loading ? 'CREATING PLAN...' : 'FINISH →'}
            </button>
          </div>
        )}

        {error ? <div style={{ marginTop: 14, color: '#ff4d4f', padding: '0 24px' }}>{error}</div> : null}
      </div>
    </div>
  );
}