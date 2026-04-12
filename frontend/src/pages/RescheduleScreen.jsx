import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import './Reschedule.css';

export default function RescheduleScreen() {
  const { state, dispatch, navigate, signOut } = useApp();
  const { activePlan } = state;
  const [missedDays, setMissedDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!activePlan) return <div className="loading-screen"><div className="spinner" /></div>;

  const missedTasks = activePlan.daily_tasks.filter(t => t.status === 'missed').map(t => t.day_number);
  const toggleDay = (num) => setMissedDays(prev =>
    prev.includes(num) ? prev.filter(d => d !== num) : [...prev, num]
  );

  const handleReschedule = async () => {
    if (!missedDays.length) { setError('Select at least one missed day.'); return; }
    setLoading(true); setError('');
    try {
      const completedDays = activePlan.daily_tasks.filter(t => t.status === 'completed').map(t => t.day_number);
      const prevTotal = activePlan.total_days;
      const updated = await api.reschedulePlan(activePlan.plan_id, missedDays, completedDays);
      dispatch({ type: 'SET_PLAN', payload: updated });
      setResult({ updated, prevTotal });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="reschedule-screen screen">
      <nav className="dash-nav">
        <div className="dash-logo"><div className="logo-mark">S</div><span>SYNTHEIA</span></div>
        <div className="mono text-gray" style={{ fontSize: '0.75rem' }}>RESCHEDULE PLAN</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost mono" onClick={() => navigate('dashboard')} style={{ fontSize: '0.8rem' }}>← Dashboard</button>
          <button className="btn btn-ghost mono" onClick={signOut} style={{ fontSize: '0.8rem', color: '#ff6b6b' }}>Sign Out</button>
        </div>
      </nav>

      <div className="reschedule-content container">
        {!result ? (
          <>
            <div className="reschedule-hero">
              <div className="mono text-yellow" style={{ fontSize: '0.75rem', marginBottom: 8 }}>SMART RESCHEDULER</div>
              <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: 16 }}>MISSED A FEW<br />DAYS?</h1>
              <p style={{ color: 'var(--gray-5)', maxWidth: 520, lineHeight: 1.7 }}>
                No stress. Select which days you missed and we'll redistribute those topics — without overloading any day.
              </p>
            </div>

            <div className="reschedule-form card">
              <div className="mono text-gray" style={{ fontSize: '0.7rem', marginBottom: 16, letterSpacing: '0.1em' }}>SELECT MISSED DAYS</div>
              {missedTasks.length > 0 && (
                <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="mono text-gray" style={{ fontSize: '0.75rem' }}>{missedTasks.length} day(s) already marked missed</span>
                  <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={() => setMissedDays(missedTasks)}>
                    Auto-fill missed days
                  </button>
                </div>
              )}
              <div className="day-selector-grid">
                {activePlan.daily_tasks?.filter(t => t.status !== 'completed').map(t => (
                  <button key={t.day_number} className={`day-sel-btn ${missedDays.includes(t.day_number) ? 'selected' : ''}`} onClick={() => toggleDay(t.day_number)}>
                    {t.day_number}
                  </button>
                ))}
              </div>
              {missedDays.length > 0 && (
                <div className="selected-days">
                  <span className="mono text-gray" style={{ fontSize: '0.75rem' }}>SELECTED:</span>
                  {missedDays.map(d => <span key={d} className="badge badge-red">Day {d}</span>)}
                  <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setMissedDays([])}>Clear</button>
                </div>
              )}
              {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={handleReschedule} disabled={loading || !missedDays.length}>
                  {loading ? 'Rescheduling...' : `Reschedule ${missedDays.length || ''} Day(s) →`}
                </button>
                <button className="btn btn-outline" onClick={() => navigate('dashboard')}>Cancel</button>
              </div>
            </div>

            <div className="card card-accent" style={{ marginTop: 24 }}>
              <div className="mono text-gray" style={{ fontSize: '0.7rem', marginBottom: 8 }}>HOW IT WORKS</div>
              <div style={{ color: 'var(--gray-5)', fontSize: '0.9rem', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span>→ Missed topics get redistributed to future days</span>
                <span>→ No day exceeds its original time limit</span>
                <span>→ If needed, new catch-up days are created</span>
                <span>→ Completed days are never touched</span>
              </div>
            </div>
          </>
        ) : (
          <div className="reschedule-result">
            <div className="result-icon">✓</div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: 16 }}>PLAN UPDATED!</h2>
            <div className="result-comparison">
              <div className="result-box">
                <span className="mono text-gray" style={{ fontSize: '0.7rem' }}>BEFORE</span>
                <span className="result-num">{result.prevTotal}</span>
                <span className="mono text-gray" style={{ fontSize: '0.75rem' }}>total days</span>
              </div>
              <span className="text-yellow" style={{ fontSize: '2rem' }}>→</span>
              <div className="result-box">
                <span className="mono text-gray" style={{ fontSize: '0.7rem' }}>AFTER</span>
                <span className="result-num text-yellow">{result.updated.total_days}</span>
                <span className="mono text-gray" style={{ fontSize: '0.75rem' }}>total days</span>
              </div>
            </div>
            <p style={{ color: 'var(--gray-5)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 32px' }}>
              Your missed topics have been redistributed. No topic was skipped — only rescheduled.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => navigate('dashboard')}>Back to Dashboard</button>
              <button className="btn btn-outline" onClick={() => navigate('calendar')}>View New Calendar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}