import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import './Progress.css';

export default function ProgressScreen() {
  const { state, navigate } = useApp();
  const { activePlan } = state;
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activePlan?.plan_id) return;
    api.getProgress(activePlan.plan_id).then(setProgress).finally(() => setLoading(false));
  }, [activePlan?.plan_id]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const tasks = activePlan?.daily_tasks || [];
  const completed = tasks.filter(t => t.status === 'completed');
  const missed = tasks.filter(t => t.status === 'missed');
  const pending = tasks.filter(t => t.status === 'pending');
  const pct = progress?.completion_percentage || 0;

  const weeks = [];
  for (let i = 0; i < tasks.length; i += 7) {
    const week = tasks.slice(i, i + 7);
    weeks.push({ label: `W${Math.floor(i / 7) + 1}`, completed: week.filter(t => t.status === 'completed').length, total: week.length });
  }

  return (
    <div className="progress-screen screen">
      <nav className="dash-nav">
        <div className="dash-logo"><div className="logo-mark">S</div><span>SYNTHEIA</span></div>
        <div className="dash-nav-links">
          <button className="nav-link" onClick={() => navigate('dashboard')}>Dashboard</button>
          <button className="nav-link" onClick={() => navigate('calendar')}>Calendar</button>
          <button className="nav-link active">Progress</button>
        </div>
        <button className="btn btn-ghost mono" onClick={() => navigate('dashboard')} style={{ fontSize: '0.8rem' }}>← Back</button>
      </nav>

      <div className="progress-content container">
        <div className="mono text-gray" style={{ fontSize: '0.75rem', marginBottom: 8 }}>PROGRESS ANALYTICS</div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: 40 }}>
          YOU'RE AT <span className="text-yellow">{Math.round(pct)}%</span>
        </h1>

        <div className="prog-stats">
          {[
            { label: 'Days Completed', val: completed.length, color: 'var(--green)' },
            { label: 'Days Missed',    val: missed.length,    color: 'var(--red)' },
            { label: 'Days Remaining', val: pending.length,   color: 'var(--yellow)' },
            { label: '🔥 Streak',      val: progress?.current_streak || 0, color: 'var(--white)' },
            { label: 'Total Days',     val: activePlan?.total_days || 0,   color: 'var(--gray-4)' },
            { label: 'Total Hours',    val: `${activePlan?.total_hours || 0}h`, color: 'var(--gray-4)' },
          ].map(s => (
            <div key={s.label} className="prog-stat-box">
              <span className="prog-stat-val" style={{ color: s.color }}>{s.val}</span>
              <span className="prog-stat-label mono">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="prog-bar-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="mono text-gray" style={{ fontSize: '0.75rem' }}>OVERALL PROGRESS</span>
            <span className="mono text-yellow" style={{ fontSize: '0.75rem' }}>{Math.round(pct)}%</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}><div className="progress-bar-fill" style={{ width: `${pct}%` }} /></div>
        </div>

        {weeks.length > 0 && (
          <div className="prog-chart-section">
            <div className="mono text-gray" style={{ fontSize: '0.75rem', marginBottom: 20 }}>WEEKLY BREAKDOWN</div>
            <div className="prog-chart">
              {weeks.map(w => {
                const h = w.total ? (w.completed / w.total) * 100 : 0;
                return (
                  <div key={w.label} className="prog-bar-col">
                    <div className="prog-bar-track"><div className="prog-bar-inner" style={{ height: `${h}%` }} /></div>
                    <span className="prog-bar-pct mono">{w.completed}/{w.total}</span>
                    <span className="prog-bar-week mono">{w.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="prog-grid">
          {progress?.pace_suggestion && (
            <div className="card card-accent">
              <div className="mono text-gray" style={{ fontSize: '0.7rem', marginBottom: 12 }}>PACE ANALYSIS</div>
              <div className="pace-analysis-row">
                <div className="pace-analysis-item">
                  <span className="mono text-gray" style={{ fontSize: '0.7rem' }}>CURRENT</span>
                  <span className="pace-val">{progress.pace_suggestion.current_pace}</span>
                </div>
                <span className="text-yellow" style={{ fontSize: '1.5rem' }}>→</span>
                <div className="pace-analysis-item">
                  <span className="mono text-gray" style={{ fontSize: '0.7rem' }}>SUGGESTED</span>
                  <span className="pace-val" style={{ color: 'var(--yellow)' }}>{progress.pace_suggestion.suggested_pace}</span>
                </div>
              </div>
              <p style={{ color: 'var(--gray-5)', fontSize: '0.85rem', lineHeight: 1.6, marginTop: 12 }}>{progress.pace_suggestion.rationale}</p>
            </div>
          )}
          {progress?.recommendations?.length > 0 && (
            <div className="card">
              <div className="mono text-gray" style={{ fontSize: '0.7rem', marginBottom: 12 }}>✦ AI RECOMMENDATIONS</div>
              {progress.recommendations.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                  <span className="text-yellow" style={{ marginTop: 2 }}>→</span>
                  <span style={{ color: 'var(--gray-5)', fontSize: '0.9rem', lineHeight: 1.6 }}>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('dashboard')}>Back to Dashboard</button>
          <button className="btn btn-outline" onClick={() => navigate('calendar')}>View Calendar</button>
          <button className="btn btn-outline" onClick={() => navigate('reschedule')}>↺ Reschedule Plan</button>
        </div>
      </div>
    </div>
  );
}