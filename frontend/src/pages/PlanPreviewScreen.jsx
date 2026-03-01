import { useApp } from '../context/AppContext';
import './PlanPreview.css';

function fmt(min) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function PlanPreviewScreen() {
  const { state, navigate } = useApp();
  const { activePlan } = state;

  if (!activePlan) return <div className="loading-screen"><div className="spinner" /></div>;

  const firstWeek = activePlan.daily_tasks?.slice(0, 7) || [];

  return (
    <div className="preview-screen screen">
      <div className="preview-header">
        <button className="btn btn-ghost" onClick={() => navigate('onboarding')}>← Back</button>
        <div className="mono text-gray" style={{ fontSize: '0.75rem' }}>PLAN PREVIEW</div>
      </div>

      <div className="preview-content container">
        <div className="preview-hero">
          <div className="mono text-yellow" style={{ fontSize: '0.75rem', letterSpacing: '0.15em' }}>YOUR PLAN IS READY</div>
          <h1 className="preview-headline">
            {activePlan.total_days} DAYS TO<br />
            <span className="text-yellow">{activePlan.level?.toUpperCase()} {activePlan.module_id?.toUpperCase()}</span>
          </h1>
          <div className="preview-meta">
            {[
              { label: 'TOTAL HOURS', val: `${activePlan.total_hours}h` },
              { label: 'PACE', val: activePlan.pace },
              { label: 'START DATE', val: activePlan.start_date },
              ...(activePlan.target_end_date ? [{ label: 'TARGET END', val: activePlan.target_end_date }] : []),
            ].map(m => (
              <div key={m.label} className="meta-chip">
                <span className="mono text-gray">{m.label}</span>
                <span className="meta-val">{m.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="preview-body">
          <div className="preview-section">
            <div className="section-label mono">FIRST 7 DAYS</div>
            <div className="days-list">
              {firstWeek.map(day => (
                <div key={day.day_number} className="day-row">
                  <div className="day-num">
                    <span className="mono">DAY</span>
                    <span className="day-num-val">{day.day_number}</span>
                  </div>
                  <div className="day-topics">
                    {day.topics.map(t => <span key={t} className="topic-pill">{t}</span>)}
                  </div>
                  <div className="day-time mono text-gray">{fmt(day.estimated_time_minutes)}</div>
                </div>
              ))}
              {activePlan.total_days > 7 && (
                <div className="day-row day-row-more">
                  <span className="mono text-gray">+ {activePlan.total_days - 7} more days</span>
                </div>
              )}
            </div>
          </div>

          <div className="preview-section">
            <div className="section-label mono">PLAN ID</div>
            <div className="card" style={{ padding: '12px 16px' }}>
              <span className="mono text-gray" style={{ fontSize: '0.85rem' }}>{activePlan.plan_id}</span>
            </div>
          </div>
        </div>

        <div className="preview-cta">
          <button className="btn btn-primary" onClick={() => navigate('dashboard')}>Start Learning →</button>
          <button className="btn btn-outline" onClick={() => navigate('onboarding')}>↺ Regenerate Plan</button>
        </div>
      </div>
    </div>
  );
}