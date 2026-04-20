import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import './Reschedule.css';

export default function RescheduleScreen() {
  const { state, dispatch, navigate, signOut } = useApp();
  const { activePlan } = state;

  // Mode: 'shift' = push everything forward, 'missed' = requeue specific days
  const [mode, setMode] = useState(null);
  const [shiftAmount, setShiftAmount] = useState(1);
  const [missedDays, setMissedDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!activePlan) return <div className="loading-screen"><div className="spinner" /></div>;

  const pendingTasks = activePlan.daily_tasks.filter(t => t.status !== 'completed');
  const completedDays = activePlan.daily_tasks.filter(t => t.status === 'completed').map(t => t.day_number);

  const toggleDay = (num) => setMissedDays(prev =>
    prev.includes(num) ? prev.filter(d => d !== num) : [...prev, num]
  );

  const handleReschedule = async () => {
    setLoading(true);
    setError('');
    try {
      const prevTotal = activePlan.total_days;
      let updated;

      if (mode === 'shift') {
        // SHIFT MODE: push all pending days forward by shiftAmount
        updated = await api.reschedulePlan(
          activePlan.plan_id,
          [],             // no missed days
          activePlan,     // pass full plan object
          completedDays,
          null,
          shiftAmount     // shift_days
        );
      } else {
        // MISSED MODE: requeue selected days at the end
        if (!missedDays.length) {
          setError('Select at least one day to reschedule.');
          setLoading(false);
          return;
        }
        updated = await api.reschedulePlan(
          activePlan.plan_id,
          missedDays,
          activePlan,
          completedDays,
          null,
          0               // no shift
        );
      }

      dispatch({ type: 'SET_PLAN', payload: updated });
      setResult({ updated, prevTotal, mode, shiftAmount, missedCount: missedDays.length });
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Success Screen ────────────────────────────────────────────────
  if (result) {
    const added = result.updated.total_days - result.prevTotal;
    return (
      <div className="reschedule-screen screen">
        <nav className="dash-nav">
          <div className="dash-logo"><div className="logo-mark">S</div><span>SYNTHEIA</span></div>
          <div className="mono text-gray" style={{ fontSize: '0.75rem' }}>RESCHEDULE PLAN</div>
          <button className="btn btn-ghost mono" onClick={() => navigate('dashboard')} style={{ fontSize: '0.8rem' }}>← Dashboard</button>
        </nav>

        <div className="reschedule-content container">
          <div className="reschedule-result">
            <div className="result-icon">✓</div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: 8 }}>PLAN UPDATED!</h2>
            <p className="mono text-yellow" style={{ fontSize: '0.8rem', marginBottom: 24 }}>
              {result.mode === 'shift'
                ? `Shifted all remaining days forward by ${result.shiftAmount} day${result.shiftAmount > 1 ? 's' : ''}`
                : `${result.missedCount} day${result.missedCount > 1 ? 's' : ''} requeued at the end of your plan`}
            </p>

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
                <span className="mono text-gray" style={{ fontSize: '0.75rem' }}>
                  total days{added > 0 ? ` (+${added})` : ''}
                </span>
              </div>
            </div>

            <p style={{ color: 'var(--gray-5)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 32px' }}>
              {result.mode === 'shift'
                ? 'Your entire remaining schedule has been shifted forward. No topics were skipped — just delayed.'
                : 'The topics from your missed days have been added to the end of your plan. Your sequence is intact.'}
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => navigate('dashboard')}>Back to Dashboard</button>
              <button className="btn btn-outline" onClick={() => navigate('calendar')}>View New Calendar</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Screen ───────────────────────────────────────────────────
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
        <div className="reschedule-hero">
          <div className="mono text-yellow" style={{ fontSize: '0.75rem', marginBottom: 8 }}>SMART RESCHEDULER</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: 16 }}>NEED MORE<br />TIME?</h1>
          <p style={{ color: 'var(--gray-5)', maxWidth: 520, lineHeight: 1.7 }}>
            Life happens. Choose how you want to adjust your plan — no topics are ever skipped.
          </p>
        </div>

        {/* Mode selector */}
        {!mode && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 8 }}>

            {/* Option 1: Shift forward */}
            <button
              onClick={() => setMode('shift')}
              style={{
                textAlign: 'left', cursor: 'pointer', padding: '28px 24px',
                background: 'linear-gradient(135deg, rgba(212,255,0,0.08) 0%, rgba(212,255,0,0.03) 100%)',
                border: '1.5px solid rgba(212,255,0,0.4)',
                borderRadius: 12,
                transition: 'all 0.25s ease',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#d4ff00'; e.currentTarget.style.boxShadow = '0 0 30px rgba(212,255,0,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,255,0,0.4)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 14, filter: 'none' }}>📅</div>
              <div style={{ color: '#d4ff00', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', marginBottom: 8 }}>
                OPTION 1 — SHIFT FORWARD
              </div>
              <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.2rem', marginBottom: 10 }}>
                Push Everything Forward
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.65 }}>
                Add buffer days to your entire remaining schedule. Best when you know you'll be busy for a few days — no topics are dropped.
              </div>
              <div style={{ color: '#d4ff00', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ padding: '3px 8px', border: '1px solid rgba(212,255,0,0.4)', borderRadius: 4 }}>+1</span>
                <span>day → whole schedule shifts right →</span>
              </div>
              <div style={{ position: 'absolute', top: 16, right: 20, color: '#d4ff00', fontSize: '1.2rem', opacity: 0.5 }}>→</div>
            </button>

            {/* Option 2: Requeue missed */}
            <button
              onClick={() => setMode('missed')}
              style={{
                textAlign: 'left', cursor: 'pointer', padding: '28px 24px',
                background: 'linear-gradient(135deg, rgba(255,100,100,0.08) 0%, rgba(255,100,100,0.03) 100%)',
                border: '1.5px solid rgba(255,100,100,0.35)',
                borderRadius: 12,
                transition: 'all 0.25s ease',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6464'; e.currentTarget.style.boxShadow = '0 0 30px rgba(255,100,100,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,100,100,0.35)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>🔁</div>
              <div style={{ color: '#ff8080', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', marginBottom: 8 }}>
                OPTION 2 — REQUEUE MISSED
              </div>
              <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.2rem', marginBottom: 10 }}>
                Move Missed Days to End
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.65 }}>
                Select specific days you skipped. Their topics are added as brand new days at the end — your total day count increases.
              </div>
              <div style={{ color: '#ff8080', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ padding: '3px 8px', border: '1px solid rgba(255,100,100,0.4)', borderRadius: 4 }}>Day 3</span>
                <span>missed → added as Day {activePlan.total_days + 1} →</span>
              </div>
              <div style={{ position: 'absolute', top: 16, right: 20, color: '#ff8080', fontSize: '1.2rem', opacity: 0.5 }}>+</div>
            </button>
          </div>
        )}

        {/* SHIFT MODE form */}
        {mode === 'shift' && (
          <div className="reschedule-form card" style={{ marginTop: 16 }}>
            <button
              className="btn btn-ghost mono"
              style={{ fontSize: '0.75rem', marginBottom: 16, padding: '6px 12px' }}
              onClick={() => setMode(null)}
            >
              ← Back
            </button>
            <div className="mono text-gray" style={{ fontSize: '0.7rem', marginBottom: 12, letterSpacing: '0.1em' }}>
              SHIFT ALL REMAINING DAYS FORWARD BY:
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {[1, 2, 3, 5, 7].map(n => (
                <button
                  key={n}
                  onClick={() => setShiftAmount(n)}
                  className={`day-sel-btn ${shiftAmount === n ? 'selected' : ''}`}
                  style={{ minWidth: 56, fontSize: '1rem', fontWeight: 700 }}
                >
                  +{n}
                </button>
              ))}
            </div>
            <div style={{ color: 'var(--gray-5)', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.6 }}>
              <span className="mono text-yellow">What will happen: </span>
              All {pendingTasks.length} remaining day{pendingTasks.length !== 1 ? 's' : ''} will shift forward by {shiftAmount} day{shiftAmount > 1 ? 's' : ''}. 
              Your plan will grow from <strong style={{ color: 'white' }}>{activePlan.total_days}</strong> to <strong style={{ color: '#d4ff00' }}>{activePlan.total_days + shiftAmount}</strong> total days.
              Topics stay in the exact same order.
            </div>
            {error && <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleReschedule} disabled={loading}>
                {loading ? 'Updating...' : `Shift Forward +${shiftAmount} Day${shiftAmount > 1 ? 's' : ''} →`}
              </button>
              <button className="btn btn-outline" onClick={() => setMode(null)}>Cancel</button>
            </div>
          </div>
        )}

        {/* MISSED MODE form */}
        {mode === 'missed' && (
          <div className="reschedule-form card" style={{ marginTop: 16 }}>
            <button
              className="btn btn-ghost mono"
              style={{ fontSize: '0.75rem', marginBottom: 16, padding: '6px 12px' }}
              onClick={() => { setMode(null); setMissedDays([]); }}
            >
              ← Back
            </button>
            <div className="mono text-gray" style={{ fontSize: '0.7rem', marginBottom: 12, letterSpacing: '0.1em' }}>
              SELECT DAYS TO MOVE TO END OF PLAN
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
              {pendingTasks.map(t => {
                const isSelected = missedDays.includes(t.day_number);
                const isBuffer = t.topics?.includes('Rest / Buffer Day') || !t.topics?.length;
                return (
                  <button
                    key={t.day_number}
                    onClick={() => !isBuffer && toggleDay(t.day_number)}
                    disabled={isBuffer}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 16px', borderRadius: 8, textAlign: 'left',
                      border: `1.5px solid ${isSelected ? '#ff6464' : isBuffer ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)'}`,
                      background: isSelected ? 'rgba(255,100,100,0.1)' : isBuffer ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                      cursor: isBuffer ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: isBuffer ? 0.4 : 1,
                    }}
                  >
                    <div style={{
                      minWidth: 40, height: 40, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSelected ? '#ff6464' : 'rgba(255,255,255,0.08)',
                      fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800,
                      color: isSelected ? '#000' : 'rgba(255,255,255,0.8)',
                      flexShrink: 0,
                    }}>
                      D{t.day_number}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isBuffer
                        ? <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Rest / Buffer Day</span>
                        : <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 500 }}>
                            {(t.topics || []).slice(0, 2).join(', ')}{(t.topics?.length || 0) > 2 ? ` +${t.topics.length - 2} more` : ''}
                          </span>
                      }
                    </div>
                    {isSelected && <span style={{ color: '#ff6464', fontSize: '1rem', flexShrink: 0 }}>✓</span>}
                  </button>
                );
              })}
            </div>
            {missedDays.length > 0 && (
              <div className="selected-days" style={{ marginTop: 12 }}>
                <span className="mono text-gray" style={{ fontSize: '0.75rem' }}>MOVING TO END:</span>
                {missedDays.sort((a, b) => a - b).map(d => <span key={d} className="badge badge-red">Day {d}</span>)}
                <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setMissedDays([])}>Clear</button>
              </div>
            )}
            {missedDays.length > 0 && (
              <div style={{ color: 'var(--gray-5)', fontSize: '0.85rem', margin: '14px 0', lineHeight: 1.6 }}>
                <span className="mono text-yellow">What will happen: </span>
                {missedDays.length} day{missedDays.length > 1 ? 's' : ''} will be marked missed and their content added at the end as new days.
                Plan grows from <strong style={{ color: 'white' }}>{activePlan.total_days}</strong> to <strong style={{ color: '#d4ff00' }}>{activePlan.total_days + missedDays.length}</strong> total days.
              </div>
            )}
            {error && <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleReschedule} disabled={loading || !missedDays.length}>
                {loading ? 'Updating...' : `Move ${missedDays.length || ''} Day${missedDays.length !== 1 ? 's' : ''} to End →`}
              </button>
              <button className="btn btn-outline" onClick={() => { setMode(null); setMissedDays([]); }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Info card — only on mode select screen */}
        {!mode && (
          <div className="card card-accent" style={{ marginTop: 24 }}>
            <div className="mono text-gray" style={{ fontSize: '0.7rem', marginBottom: 8 }}>GOOD TO KNOW</div>
            <div style={{ color: 'var(--gray-5)', fontSize: '0.9rem', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>→ Completed days are never touched or moved</span>
              <span>→ Your topic sequence is always preserved</span>
              <span>→ You can reschedule as many times as needed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}