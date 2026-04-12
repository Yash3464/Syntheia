import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import QuizModal from '../components/QuizModal';
import './Dashboard.css';

function fmt(min) {
  if (!min) return '—';
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60 ? min % 60 + 'm' : ''}`.trim();
}

export default function DashboardScreen() {
  const { state, dispatch, navigate, signOut } = useApp();
  const { activePlan } = state;
  const [progress, setProgress] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [quizFor, setQuizFor] = useState(null);
  const [error, setError] = useState('');

  const loadProgress = useCallback(async () => {
    if (!activePlan?.plan_id) return;
    try {
      const p = await api.getProgress(activePlan.plan_id);
      setProgress(p);
    } catch (e) { setError(e.message); }
  }, [activePlan?.plan_id]);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  const onQuizComplete = async () => {
    const day = quizFor;
    if (!day) return;
    
    setQuizFor(null);
    setCompleting(day.day_number);
    try {
      await api.markDayCompleted(activePlan.plan_id, day.day_number);
      const updated = await api.getLearningPath(activePlan.plan_id);
      dispatch({ type: 'SET_PLAN', payload: updated });
      await loadProgress();
    } catch (e) { 
      setError(e.message); 
    } finally { 
      setCompleting(null); 
    }
  };

  const handleCompleteRequest = (day) => {
    setQuizFor(day);
  };

  if (!activePlan) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p className="mono text-gray mt-16">LOADING YOUR JOURNEY...</p>
    </div>
  );

  const today = activePlan.daily_tasks?.find(t => t.status === 'pending') || activePlan.daily_tasks?.[0];
  const completedCount = activePlan.daily_tasks?.filter(t => t.status === 'completed').length || 0;
  const pct = activePlan.total_days ? Math.round((completedCount / activePlan.total_days) * 100) : 0;
  const recentDays = activePlan.daily_tasks?.slice(0, 10) || [];

  return (
    <div className="dash-screen screen">
      <nav className="dash-nav">
        <div className="dash-logo"><div className="logo-mark">S</div><span>SYNTHEIA</span></div>
        <div className="dash-nav-links">
          <button className="nav-link active">Dashboard</button>
          <button className="nav-link" onClick={() => navigate('calendar')}>Calendar</button>
          <button className="nav-link" onClick={() => navigate('progress')}>Progress</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost mono" onClick={() => navigate('welcome')} style={{ fontSize: '0.8rem' }}>↩ Home</button>
          <button className="btn btn-ghost mono" onClick={signOut} style={{ fontSize: '0.8rem', color: '#ff6b6b' }}>Sign Out</button>
        </div>
      </nav>

      <div className="dash-content container">
        <div className="dash-hero">
          <div className="dash-greeting">
            <span className="mono text-gray" style={{ fontSize: '0.75rem' }}>LEARNING PATH</span>
            <h1 className="dash-title">{activePlan.module_id?.toUpperCase()} — <span className="text-yellow">{activePlan.level?.toUpperCase()}</span></h1>
            <div className="dash-subtitle mono text-gray">Plan: {activePlan.plan_id} · Pace: {activePlan.pace}</div>
          </div>
          <div className="dash-stats-row">
            {[
              { num: `${pct}%`, label: 'Complete' },
              { num: completedCount, label: 'Days Done' },
              { num: activePlan.total_days - completedCount, label: 'Remaining' },
              ...(progress ? [{ num: progress.current_streak, label: '🔥 Streak' }] : []),
            ].map(s => (
              <div key={s.label} className="stat-box">
                <span className="stat-box-num">{s.num}</span>
                <span className="stat-box-label mono">{s.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${pct}%` }} /></div>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="dash-grid">
          <div className="today-card">
            <div className="section-head">
              <span className="mono text-gray" style={{ fontSize: '0.7rem', letterSpacing: '0.12em' }}>TODAY'S TASK</span>
              {today && <span className={`badge badge-${today.status === 'completed' ? 'green' : 'yellow'}`}>{today.status}</span>}
            </div>
            {today ? (
              <>
                <div className="today-day-num mono">Day {today.day_number}</div>
                <div className="today-topics">
                  {today.topics.map(t => (
                    <div key={t} className="today-topic-row">
                      <span className="today-check">○</span>
                      <span className="today-topic-name">{t}</span>
                    </div>
                  ))}
                </div>
                <div className="today-meta mono text-gray">Estimated: {fmt(today.estimated_time_minutes)}</div>
                {today.status !== 'completed' ? (
                  <button className="btn btn-primary w-full" style={{ justifyContent: 'center', marginTop: 16 }}
                    onClick={() => handleCompleteRequest(today)} disabled={completing === today.day_number}>
                    {completing === today.day_number ? 'Saving...' : '✓ Mark Day Complete'}
                  </button>
                ) : (
                  <div className="done-banner">
                    <span className="text-green">✓ Completed!</span>
                    <span className="mono text-gray" style={{ fontSize: '0.8rem' }}>Great work today.</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray mono" style={{ padding: '24px 0' }}>All days complete! 🎉</div>
            )}
          </div>

          <div className="dash-sidebar">
            {progress?.recommendations?.length > 0 && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="mono text-gray" style={{ fontSize: '0.7rem', letterSpacing: '0.12em', marginBottom: 12 }}>✦ AI RECOMMENDATIONS</div>
                {progress.recommendations.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                    <span className="text-yellow" style={{ fontSize: '0.8rem' }}>→</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--gray-5)' }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
            {progress?.pace_suggestion?.adjustment_needed && (
              <div className="card card-accent" style={{ marginBottom: 16 }}>
                <div className="mono text-gray" style={{ fontSize: '0.7rem', marginBottom: 8 }}>PACE SUGGESTION</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--gray-5)', lineHeight: 1.6 }}>{progress.pace_suggestion.rationale}</p>
                <div className="mono text-yellow" style={{ fontSize: '0.85rem', marginTop: 8 }}>
                  {progress.pace_suggestion.current_pace} → {progress.pace_suggestion.suggested_pace}
                </div>
              </div>
            )}
            <div className="card">
              <div className="mono text-gray" style={{ fontSize: '0.7rem', marginBottom: 12 }}>QUICK ACTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('calendar')}>📅 View Calendar</button>
                <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('progress')}>📊 Progress Analytics</button>
                <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('reschedule')}>↺ Reschedule Plan</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 40 }}>
          <div className="mono text-gray" style={{ fontSize: '0.7rem', letterSpacing: '0.12em', marginBottom: 16 }}>RECENT DAYS</div>
          <div className="days-scroll">
            {recentDays.map(day => (
              <div key={day.day_number} className={`mini-day-card ${day.status}`} onClick={() => navigate('calendar')}>
                <div className="mini-day-num mono">D{day.day_number}</div>
                <div className="mini-day-status">
                  {day.status === 'completed' && <span className="text-green">✓</span>}
                  {day.status === 'pending' && <span className="text-yellow">·</span>}
                  {day.status === 'missed' && <span className="text-red">✗</span>}
                </div>
                <div className="mini-day-topics mono">{day.topics[0]?.slice(0, 16)}{day.topics[0]?.length > 16 ? '...' : ''}</div>
                <div className="mini-day-time mono text-gray">{fmt(day.estimated_time_minutes)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {quizFor && (
        <QuizModal 
          topics={quizFor.topics} 
          onComplete={onQuizComplete} 
          onCancel={() => setQuizFor(null)} 
        />
      )}
    </div>
  );
}