import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
      const updated = await api.markDayCompleted(activePlan.plan_id, day.day_number, activePlan);
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
      <p className="mono text-gray">LOADING YOUR JOURNEY...</p>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  };

  const today = activePlan.daily_tasks?.find(t => t.status === 'pending') || activePlan.daily_tasks?.[0];
  const completedCount = activePlan.daily_tasks?.filter(t => t.status === 'completed').length || 0;
  const pct = activePlan.total_days ? Math.round((completedCount / activePlan.total_days) * 100) : 0;
  const recentDays = activePlan.daily_tasks?.slice(0, 10) || [];

  return (
    <motion.div 
      className="dash-screen screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <nav className="dash-nav">
        <div className="dash-logo" onClick={() => navigate('welcome')}>
          <div className="logo-mark">S</div>
          <span>SYNTHEIA</span>
        </div>
        <div className="dash-nav-links">
          <button className="nav-link active">DASHBOARD</button>
          <button className="nav-link" onClick={() => navigate('calendar')}>CALENDAR</button>
          <button className="nav-link" onClick={() => navigate('progress')}>PROGRESS</button>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-ghost mono" onClick={signOut} style={{ color: 'var(--red)' }}>SIGN OUT</button>
        </div>
      </nav>

      <div className="dash-content container">
        <motion.div className="dash-hero" variants={itemVariants}>
          <div className="dash-greeting">
            <span className="mono text-yellow" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>ACTIVE PATHWAY</span>
            <h1 className="dash-title" style={{ fontSize: '3.5rem' }}>{activePlan.module_id?.toUpperCase()} <span className="text-white" style={{ opacity: 0.2 }}>/</span> {activePlan.level?.toUpperCase()}</h1>
          </div>
          
          <div className="dash-stats-row">
            {[
              { num: `${pct}%`, label: 'COMPLETE' },
              { num: completedCount, label: 'DAYS DONE' },
              { num: activePlan.total_days - completedCount, label: 'REMAINING' },
              ...(progress ? [{ num: progress.current_streak, label: '🔥 STREAK' }] : []),
            ].map(s => (
              <div key={s.label} className="stat-box">
                <span className="stat-box-num">{s.num}</span>
                <span className="stat-box-label mono">{s.label}</span>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: 24 }}>
            <div className="progress-bar">
              <motion.div 
                className="progress-bar-fill" 
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
              />
            </div>
          </div>
        </motion.div>

        {error && <div className="error-banner mb-24">{error}</div>}

        <div className="dash-grid">
          <motion.div className="today-card glass" variants={itemVariants}>
            <div className="section-head mb-24">
              <span className="mono text-gray" style={{ fontSize: '0.75rem', letterSpacing: '0.15em' }}>CURRENT OBJECTIVE</span>
              {today && <div className={`badge badge-${today.status === 'completed' ? 'green' : 'yellow'}`}>{today.status.toUpperCase()}</div>}
            </div>
            
            {today ? (
              <>
                <div className="today-day-num mono mb-16" style={{ fontSize: '1.5rem', color: 'var(--yellow)' }}>Day {today.day_number}</div>
                <div className="today-topics mb-32">
                  {today.topics.map((t, i) => (
                    <motion.div 
                      key={t} 
                      className="today-topic-row"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                    >
                      <span className="text-yellow">▹</span>
                      <span className="today-topic-name" style={{ fontSize: '1.1rem', fontWeight: 500 }}>{t}</span>
                    </motion.div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-auto pt-24" style={{ borderTop: '1px solid var(--gray-2)' }}>
                  <span className="mono text-gray">TIME ESTIMATE</span>
                  <span className="mono text-white">{fmt(today.estimated_time_minutes)}</span>
                </div>

                {today.status !== 'completed' ? (
                  <button className="btn btn-primary w-full justify-center mt-24"
                    onClick={() => handleCompleteRequest(today)} disabled={completing === today.day_number}>
                    {completing === today.day_number ? 'PROCESSING...' : 'COMPLETE MODULE'}
                  </button>
                ) : (
                  <div className="done-banner mt-24">
                    <span className="text-green" style={{ fontWeight: 800 }}>✓ MODULE SECURED</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray mono" style={{ padding: '24px 0' }}>JOURNEY COMPLETE.</div>
            )}
          </motion.div>

          <motion.div className="dash-sidebar" variants={itemVariants}>
            {progress?.recommendations?.length > 0 && (
              <div className="card glass mb-16">
                <div className="mono text-yellow mb-16" style={{ fontSize: '0.7rem', letterSpacing: '0.15em' }}>✦ AI INSIGHTS</div>
                {progress.recommendations.map((r, i) => (
                  <div key={i} className="flex gap-12 mb-12">
                    <span className="text-yellow" style={{ opacity: 0.5 }}>→</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--gray-5)', lineHeight: 1.4 }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="card glass">
              <div className="mono text-gray mb-16" style={{ fontSize: '0.7rem', letterSpacing: '0.15em' }}>SYSTEM COMMANDS</div>
              <div className="flex flex-col gap-12">
                <button className="btn btn-outline w-full justify-between" onClick={() => navigate('calendar')}>
                  CALENDAR <span>📅</span>
                </button>
                <button className="btn btn-outline w-full justify-between" onClick={() => navigate('progress')}>
                  ANALYTICS <span>📊</span>
                </button>
                <button className="btn btn-outline w-full justify-between" onClick={() => navigate('reschedule')}>
                  RESCHEDULE <span>↺</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div style={{ marginTop: 60 }} variants={itemVariants}>
          <div className="mono text-gray mb-16" style={{ fontSize: '0.7rem', letterSpacing: '0.15em' }}>SEQUENCE LOG</div>
          <div className="days-scroll">
            {recentDays.map((day, i) => (
              <motion.div 
                key={day.day_number} 
                className={`mini-day-card ${day.status}`} 
                onClick={() => navigate('calendar')}
                whileHover={{ y: -5, borderColor: 'var(--yellow)' }}
              >
                <div className="mini-day-num mono">D{day.day_number}</div>
                <div className="mini-day-status">
                  {day.status === 'completed' && <span className="text-green">●</span>}
                  {day.status === 'pending' && <span className="text-yellow">◌</span>}
                  {day.status === 'missed' && <span className="text-red">○</span>}
                </div>
                <div className="mini-day-topics mono">{day.topics[0]?.slice(0, 16)}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
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
