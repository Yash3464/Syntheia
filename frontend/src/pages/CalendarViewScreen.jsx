import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import './CalendarView.css';

const STATUS_COLOR = { completed: 'var(--green)', missed: 'var(--red)', pending: 'var(--gray-3)', in_progress: 'var(--yellow)' };

function fmt(min) {
  if (!min) return '';
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60 ? min % 60 + 'm' : ''}`.trim();
}

export default function CalendarViewScreen() {
  const { state, dispatch, navigate } = useApp();
  const { activePlan } = state;
  const [selected, setSelected] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [missedInput, setMissedInput] = useState([]);
  const [error, setError] = useState('');

  if (!activePlan) return <div className="loading-screen"><div className="spinner" /></div>;

  const tasks = activePlan.daily_tasks || [];

  const handleComplete = async (dayNum) => {
    setCompleting(true);
    try {
      await api.markDayCompleted(activePlan.plan_id, dayNum);
      const updated = await api.getLearningPath(activePlan.plan_id);
      dispatch({ type: 'SET_PLAN', payload: updated });
      setSelected(updated.daily_tasks.find(t => t.day_number === dayNum));
    } catch (e) { setError(e.message); }
    finally { setCompleting(false); }
  };

  const toggleMissed = (dayNum) => setMissedInput(prev =>
    prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]
  );

  const handleReschedule = async () => {
    if (!missedInput.length) return;
    try {
      const updated = await api.reschedulePlan(activePlan.plan_id, missedInput);
      dispatch({ type: 'SET_PLAN', payload: updated });
      setMissedInput([]);
      navigate('reschedule');
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="cal-screen screen">
      <nav className="dash-nav">
        <div className="dash-logo"><div className="logo-mark">S</div><span>SYNTHEIA</span></div>
        <div className="dash-nav-links">
          <button className="nav-link" onClick={() => navigate('dashboard')}>Dashboard</button>
          <button className="nav-link active">Calendar</button>
          <button className="nav-link" onClick={() => navigate('progress')}>Progress</button>
        </div>
        <button className="btn btn-ghost mono" onClick={() => navigate('dashboard')} style={{ fontSize: '0.8rem' }}>← Back</button>
      </nav>

      <div className="cal-content container">
        <div className="cal-header">
          <div>
            <div className="mono text-gray" style={{ fontSize: '0.75rem', marginBottom: 8 }}>FULL PLAN CALENDAR</div>
            <h2 style={{ fontSize: '2.5rem' }}>{activePlan.total_days} DAYS</h2>
          </div>
          {missedInput.length > 0 && (
            <div className="missed-bar">
              <span className="mono text-red" style={{ fontSize: '0.8rem' }}>{missedInput.length} day(s) marked missed</span>
              <button className="btn btn-danger" onClick={handleReschedule}>Reschedule These Days</button>
              <button className="btn btn-ghost" onClick={() => setMissedInput([])}>Clear</button>
            </div>
          )}
        </div>

        {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="cal-layout">
          <div className="cal-grid">
            {tasks.map(task => (
              <button
                key={task.day_number}
                className={`cal-cell ${task.status} ${selected?.day_number === task.day_number ? 'sel' : ''} ${missedInput.includes(task.day_number) ? 'mark-missed' : ''}`}
                onClick={() => setSelected(task)}
                style={{ '--status-color': STATUS_COLOR[task.status] || STATUS_COLOR.pending }}
              >
                <span className="cal-cell-num mono">D{task.day_number}</span>
                <span className="cal-cell-status">
                  {task.status === 'completed' && '✓'}
                  {task.status === 'missed' && '✗'}
                  {task.status === 'pending' && '·'}
                </span>
                <span className="cal-cell-time mono">{fmt(task.estimated_time_minutes)}</span>
              </button>
            ))}
          </div>

          <div className="cal-detail">
            {selected ? (
              <>
                <div className="mono text-yellow" style={{ fontSize: '0.7rem', marginBottom: 12 }}>DAY {selected.day_number} DETAILS</div>
                <div className={`badge badge-${selected.status === 'completed' ? 'green' : selected.status === 'missed' ? 'red' : 'yellow'}`} style={{ marginBottom: 16 }}>{selected.status}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {selected.topics.map((t, i) => (
                    <div key={i} className="detail-topic-row"><span className="text-gray">○</span><span>{t}</span></div>
                  ))}
                </div>
                <div className="mono text-gray" style={{ fontSize: '0.8rem' }}>⏱ {fmt(selected.estimated_time_minutes)}</div>
                {selected.status === 'pending' && (
                  <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => handleComplete(selected.day_number)} disabled={completing}>
                      {completing ? 'Saving...' : '✓ Mark Complete'}
                    </button>
                    <button className="btn btn-outline w-full" style={{ justifyContent: 'center', borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => toggleMissed(selected.day_number)}>
                      {missedInput.includes(selected.day_number) ? '✗ Unmark Missed' : '✗ Mark as Missed'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="detail-empty">
                <div className="mono text-gray" style={{ fontSize: '0.85rem' }}>Click any day to see details</div>
                <div className="legend">
                  {Object.entries(STATUS_COLOR).map(([s, c]) => (
                    <div key={s} className="legend-item">
                      <span className="legend-dot" style={{ background: c }} />
                      <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--gray-4)' }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}