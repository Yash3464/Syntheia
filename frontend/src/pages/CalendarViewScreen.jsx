import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import QuizModal from '../components/QuizModal';
import './CalendarView.css';

const STATUS_COLOR = { completed: 'var(--green)', missed: 'var(--red)', pending: 'var(--gray-3)', in_progress: 'var(--yellow)' };

function fmt(min) {
  if (!min) return '';
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60 ? min % 60 + 'm' : ''}`.trim();
}

export default function CalendarViewScreen() {
  const { state, dispatch, navigate, signOut } = useApp();
  const { activePlan } = state;
  const [selected, setSelected] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [quizFor, setQuizFor] = useState(null);
  const [missedInput, setMissedInput] = useState([]);
  const [error, setError] = useState('');

  if (!activePlan) return <div className="loading-screen"><div className="spinner" /></div>;

  const tasks = activePlan.daily_tasks || [];

  const onQuizComplete = async () => {
    const dayNum = quizFor.day_number;
    setQuizFor(null);
    setCompleting(true);
    try {
      await api.markDayCompleted(activePlan.plan_id, dayNum);
      const updated = await api.getLearningPath(activePlan.plan_id);
      dispatch({ type: 'SET_PLAN', payload: updated });
      setSelected(updated.daily_tasks.find(t => t.day_number === dayNum));
    } catch (e) { setError(e.message); }
    finally { setCompleting(false); }
  };

  const handleCompleteRequest = (day) => {
    setQuizFor(day);
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

  const start = new Date(activePlan.start_date);

  return (
    <div className="cal-screen screen">
      <nav className="dash-nav">
        <div className="dash-logo"><div className="logo-mark">S</div><span>SYNTHEIA</span></div>
        <div className="dash-nav-links">
          <button className="nav-link" onClick={() => navigate('dashboard')}>Dashboard</button>
          <button className="nav-link active">Calendar</button>
          <button className="nav-link" onClick={() => navigate('progress')}>Progress</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost mono" onClick={() => navigate('dashboard')} style={{ fontSize: '0.8rem' }}>← Back</button>
          <button className="btn btn-ghost mono" onClick={signOut} style={{ fontSize: '0.8rem', color: '#ff6b6b' }}>Sign Out</button>
        </div>
      </nav>

      <div className="cal-content container">
        <div className="cal-header">
          <div>
            <div className="mono text-gray" style={{ fontSize: '0.75rem', marginBottom: 8 }}>LEARNING TIMELINE</div>
            <h2 style={{ fontSize: '3rem' }}>{activePlan.total_days} DAY JOURNEY</h2>
          </div>
          {missedInput.length > 0 && (
            <div className="missed-bar card" style={{ padding: '12px 20px', borderLeft: '3px solid var(--red)' }}>
              <span className="mono text-red" style={{ fontSize: '0.8rem' }}>{missedInput.length} DAY(S) MISSED</span>
              <button className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={handleReschedule}>Reschedule Plan</button>
              <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => setMissedInput([])}>Clear</button>
            </div>
          )}
        </div>

        {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="cal-layout">
          <div className="cal-main">
            <div className="week-label-grid">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="week-label">{d}</div>
              ))}
            </div>
            <div className="cal-grid">
              {tasks.map((task, i) => {
                const date = new Date(start);
                date.setDate(start.getDate() + i);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                return (
                  <button
                    key={task.day_number}
                    className={`cal-cell ${task.status} ${selected?.day_number === task.day_number ? 'sel' : ''} ${missedInput.includes(task.day_number) ? 'mark-missed' : ''}`}
                    onClick={() => setSelected(task)}
                    style={{ '--status-color': STATUS_COLOR[task.status] || STATUS_COLOR.pending }}
                  >
                    <span className="cal-cell-num">D{task.day_number}</span>
                    <span className="cal-cell-status">
                      {task.status === 'completed' && '✓'}
                      {task.status === 'missed' && '✗'}
                      {task.status === 'pending' && '·'}
                    </span>
                    <div className="cal-cell-time">{fmt(task.estimated_time_minutes)}</div>
                    <div className="cal-cell-date mono">{dateStr}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="cal-detail">
            {selected ? (
              <>
                <div className="mono text-yellow" style={{ fontSize: '0.7rem', marginBottom: 12, letterSpacing: '0.1em' }}>DAY {selected.day_number} DETAILS</div>
                <div style={{ marginBottom: 24 }}>
                  <div className={`badge badge-${selected.status === 'completed' ? 'green' : selected.status === 'missed' ? 'red' : 'yellow'}`} style={{ marginBottom: 12 }}>{selected.status}</div>
                  <h3 style={{ fontSize: '1.2rem', textTransform: 'none' }}>Topic Coverage</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 24 }}>
                  {selected.topics.map((t, i) => (
                    <div key={i} className="detail-topic-row">
                      <div className="detail-indicator" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center" style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--gray-2)' }}>
                  <div className="mono text-gray" style={{ fontSize: '0.85rem' }}>⏱ {fmt(selected.estimated_time_minutes)}</div>
                </div>

                {selected.status === 'pending' && (
                  <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={() => handleCompleteRequest(selected)} disabled={completing}>
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
                <div className="mono text-gray" style={{ fontSize: '0.85rem' }}>Select a day to view details</div>
                <div className="legend" style={{ marginTop: 32, width: '100%', textAlign: 'left' }}>
                  {Object.entries(STATUS_COLOR).map(([s, c]) => (
                    <div key={s} className="legend-item" style={{ marginBottom: 8 }}>
                      <span className="legend-dot" style={{ background: c }} />
                      <span className="mono" style={{ fontSize: '0.7rem' }}>{s.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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