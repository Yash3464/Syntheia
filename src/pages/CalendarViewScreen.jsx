import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import QuizModal from '../components/QuizModal';
import './CalendarView.css';

const STATUS_ICONS = { completed: '●', missed: '○', locked: '🔒', pending: '◌' };

// A buffer day has no real content — inserted by schedule shift
const isBufferDay = (task) =>
  !task || !task.topics?.length ||
  task.topics.every(t => t === 'Rest / Buffer Day') ||
  task.estimated_time_minutes === 0;

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

  // Calculate calendar grid with padding
  const gridItems = useMemo(() => {
    if (!activePlan) return [];
    const tasks = activePlan.daily_tasks || [];
    const start = new Date(activePlan.start_date);
    
    let startDay = start.getDay();
    const paddingCount = (startDay + 6) % 7;
    
    const padding = Array(paddingCount).fill({ type: 'empty' });
    
    const calendarDays = tasks.map((task, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      // Missed days count as "passed" — only pending/in_progress days block progression
      const isLocked = i > 0 && tasks.slice(0, i).some(
        t => t.status !== 'completed' && t.status !== 'missed'
      );
      
      return {
        ...task,
        type: 'day',
        date,
        isLocked,
        formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });
    
    return [...padding, ...calendarDays];
  }, [activePlan]);

  if (!activePlan) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p className="mono text-gray">INITIALIZING SYSTEM...</p>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  };

  const onQuizComplete = async () => {
    const day = quizFor;
    if (!day) return;
    setQuizFor(null);
    setCompleting(true);
    setError('');
    
    try {
      const updated = await api.markDayCompleted(activePlan.plan_id, day.day_number, activePlan);
      dispatch({ type: 'SET_PLAN', payload: updated });
      const newDay = updated.daily_tasks.find(t => t.day_number === day.day_number);
      setSelected(newDay);
    } catch (e) { 
      setError(e.message); 
    } finally { 
      setCompleting(false); 
    }
  };

  const handleReschedule = async () => {
    if (!missedInput.length) return;
    try {
      const updated = await api.reschedulePlan(activePlan.plan_id, missedInput, activePlan);
      dispatch({ type: 'SET_PLAN', payload: updated });
      setMissedInput([]);
      navigate('reschedule');
    } catch (e) { 
      setError(e.message); 
    }
  };

  const toggleMissed = (dayNum) => setMissedInput(prev =>
    prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]
  );

  return (
    <motion.div 
      className="cal-screen screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="dash-nav">
        <div className="dash-logo" onClick={() => navigate('dashboard')}>
          <div className="logo-mark">S</div>
          <span>SYNTHEIA</span>
        </div>
        <div className="dash-nav-links">
          <button className="nav-link" onClick={() => navigate('dashboard')}>DASHBOARD</button>
          <button className="nav-link active">CALENDAR</button>
          <button className="nav-link" onClick={() => navigate('progress')}>PROGRESS</button>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-ghost mono" onClick={signOut} style={{ color: 'var(--red)' }}>SIGN OUT</button>
        </div>
      </nav>

      <div className="cal-content container">
        <header className="cal-header">
          <div className="flex flex-col">
            <div className="mono text-yellow mb-8" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>PROJECT TIMELINE</div>
            <h1 style={{ fontSize: '4.5rem' }}>{activePlan.total_days} DAYS</h1>
          </div>
          
          <AnimatePresence>
            {missedInput.length > 0 && (
              <motion.div 
                className="glass flex items-center gap-24" 
                style={{ padding: '20px 32px', borderRadius: 8 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex flex-col">
                  <span className="mono text-red" style={{ fontSize: '0.75rem' }}>SYSTEM ANOMALY</span>
                  <span className="text-white" style={{ fontWeight: 800 }}>{missedInput.length} DAYS MISSED</span>
                </div>
                <button className="btn btn-primary" onClick={handleReschedule}>RESCHEDULE</button>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {error && <div className="error-banner mb-24">{error}</div>}

        <div className="cal-layout">
          <main className="cal-main">
            <div className="week-label-grid">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                <div key={d} className="week-label">{d}</div>
              ))}
            </div>
            
            <motion.div 
              className="cal-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {gridItems.map((item, i) => {
                if (item.type === 'empty') return <div key={`empty-${i}`} className="cal-cell empty" />;
                
                const isSelected = selected?.day_number === item.day_number;
                const isMissedMarked = missedInput.includes(item.day_number);
                
                return (
                  <motion.button
                    key={item.day_number}
                    className={`cal-cell ${item.status} ${isSelected ? 'sel' : ''} ${item.isLocked ? 'locked' : ''} ${isMissedMarked ? 'mark-missed' : ''}`}
                    onClick={() => setSelected(item)}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, zIndex: 1 }}
                  >
                    <div className="flex justify-between w-full">
                      <span className="cal-cell-num">D{item.day_number}</span>
                      <span className="cal-cell-status">
                        {STATUS_ICONS[
                          item.status === 'missed' ? 'missed'
                          : item.status === 'completed' ? 'completed'
                          : item.isLocked ? 'locked'
                          : 'pending'
                        ]}
                      </span>
                    </div>
                    <div className="cal-cell-date">{item.formattedDate}</div>
                  </motion.button>
                );
              })}
            </motion.div>
          </main>

          <aside className="cal-detail glass">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div 
                  key={selected.day_number}
                  className="flex flex-col h-full"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mono text-yellow mb-16" style={{ fontSize: '0.75rem' }}>DAY {selected.day_number} NODE</div>
                  
                  <div className="mb-32">
                    <div className={`badge badge-${selected.status === 'completed' ? 'green' : selected.status === 'missed' ? 'red' : 'yellow'} mb-16`}>
                      {selected.status.toUpperCase()}
                    </div>
                    <h2 style={{ fontSize: '2.5rem', textTransform: 'none' }}>Curriculum Tasks</h2>
                  </div>
                  
                  <div className="flex flex-col gap-8 mb-32">
                    {selected.topics.map((t, i) => (
                      <div key={i} className="detail-topic-row">
                        <div className="detail-indicator" />
                        <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-auto">
                    <div className="divider" />
                    <div className="flex justify-between items-center mb-24">
                      <span className="mono text-gray">ESTIMATED TIME</span>
                      <span className="mono text-white" style={{ fontWeight: 600 }}>{fmt(selected.estimated_time_minutes)}</span>
                    </div>

                    {selected.isLocked ? (
                    // Locked: show topics as preview but no action buttons
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="glass flex items-center gap-12" style={{ padding: '14px 16px', borderRadius: 6, background: 'rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '1.1rem' }}>🔒</span>
                        <span className="mono text-gray" style={{ fontSize: '0.75rem' }}>COMPLETE PREVIOUS DAYS TO UNLOCK ACTIONS</span>
                      </div>
                    </div>
                  ) : selected.status !== 'completed' && (
                      <div className="flex flex-col gap-12">
                        {isBufferDay(selected) ? (
                          // Buffer/rest days: just a skip button, no quiz
                          <>
                            <div style={{
                              padding: '16px', borderRadius: 8,
                              background: 'rgba(212,255,0,0.06)',
                              border: '1px solid rgba(212,255,0,0.2)',
                              color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6
                            }}>
                              🌿 This is a buffer day added by your schedule shift. Take a break — no topics, no quiz.
                            </div>
                            <button
                              className="btn btn-primary w-full justify-center"
                              onClick={async () => {
                                setCompleting(true);
                                try {
                                  const updated = await api.markDayCompleted(activePlan.plan_id, selected.day_number, activePlan);
                                  dispatch({ type: 'SET_PLAN', payload: updated });
                                  const newDay = updated.daily_tasks.find(t => t.day_number === selected.day_number);
                                  setSelected(newDay);
                                } catch (e) { setError(e.message); }
                                finally { setCompleting(false); }
                              }}
                              disabled={completing}
                            >
                              {completing ? 'PROCESSING...' : 'SKIP REST DAY →'}
                            </button>
                          </>
                        ) : (
                          // Normal content day
                          <>
                            <button
                              className="btn btn-primary w-full justify-center"
                              onClick={() => setQuizFor(selected)}
                              disabled={completing}
                            >
                              {completing ? 'PROCESSING...' : 'COMPLETE MODULE'}
                            </button>
                            <button
                              className="btn btn-outline w-full justify-center"
                              onClick={() => toggleMissed(selected.day_number)}
                              style={missedInput.includes(selected.day_number) ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
                            >
                              {missedInput.includes(selected.day_number) ? 'UNMARK MISSED' : 'MARK AS MISSED'}
                            </button>
                          </>
                        )}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                className="detail-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="spinner mb-24" style={{ opacity: 0.2 }} />
                <p className="mono" style={{ letterSpacing: '0.1em' }}>SELECT A NODE TO VIEW DATA</p>
              </motion.div>
            )}
            </AnimatePresence>
          </aside>
        </div>
      </div>
      
      {quizFor && (
        <QuizModal 
          topics={quizFor.topics} 
          onComplete={onQuizComplete} 
          onCancel={() => setQuizFor(null)} 
        />
      )}
    </motion.div>
  );
}
