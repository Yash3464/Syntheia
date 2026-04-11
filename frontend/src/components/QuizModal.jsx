import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function QuizModal({ topics, onComplete, onCancel }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getQuizQuestions(topics)
      .then(setQuestions)
      .catch(e => setError('Failed to load quiz. ' + e.message))
      .finally(() => setLoading(false));
  }, [topics]);

  const handleSelect = (optIdx) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = {
      q: questions[currentIdx].q,
      selected: optIdx,
      correct: questions[currentIdx].a
    };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.submitQuiz(answers);
      setResult(res);
    } catch (e) {
      setError('Failed to submit. ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="modal-overlay">
      <div className="modal-content card items-center justify-center" style={{ minHeight: 300 }}>
        <div className="spinner" />
        <p className="mono text-gray mt-16">PREPARING YOUR SKILL CHECK...</p>
      </div>
    </div>
  );

  if (result) return (
    <div className="modal-overlay">
      <div className="modal-content card text-center">
        <div className="mono text-yellow mb-8">SKILL CHECK COMPLETE</div>
        <h2 style={{ fontSize: '3rem', marginBottom: 12 }}>{result.score_percentage}%</h2>
        <p className="mb-24 text-gray">{result.passed ? 'Excellent! You have mastered today\'s topics.' : 'You didn\'t pass this time, but keep learning!'}</p>
        
        {result.passed ? (
          <button className="btn btn-primary w-full justify-center" onClick={onComplete}>Continue to Mark Complete</button>
        ) : (
          <button className="btn btn-outline w-full justify-center" onClick={onCancel}>Try Reviewing Again</button>
        )}
      </div>
    </div>
  );

  const q = questions[currentIdx];

  return (
    <div className="modal-overlay">
      <div className="modal-content card">
        <div className="flex justify-between items-center mb-24">
          <div className="mono text-gray" style={{ fontSize: '0.7rem' }}>QUESTION {currentIdx + 1} OF {questions.length}</div>
          <button className="btn-ghost" onClick={onCancel}>✕</button>
        </div>

        {error && <div className="error-banner mb-16">{error}</div>}

        <h3 style={{ fontSize: '1.5rem', marginBottom: 24, textTransform: 'none', lineHeight: 1.4 }}>{q.q}</h3>

        <div className="quiz-options">
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={`quiz-opt-btn ${answers[currentIdx]?.selected === i ? 'selected' : ''}`}
              onClick={() => handleSelect(i)}
            >
              <span className="opt-letter mono">{String.fromCharCode(65 + i)}</span>
              <span className="opt-text">{opt}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mt-32">
          <div className="progress-bar" style={{ width: '60%', height: 4 }}>
            <div className="progress-bar-fill" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
          </div>
          <button 
            className="btn btn-primary" 
            disabled={answers[currentIdx] === undefined || submitting}
            onClick={handleNext}
          >
            {currentIdx === questions.length - 1 ? (submitting ? 'Checking...' : 'Finish') : 'Next Question'}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.85); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          width: 100%; max-width: 500px;
          animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .quiz-options { display: flex; flex-direction: column; gap: 10px; }
        .quiz-opt-btn {
          display: flex; align-items: center; gap: 16px;
          padding: 16px; background: var(--gray-2); border: 1px solid var(--gray-3);
          border-radius: var(--radius); cursor: pointer; transition: var(--transition);
          text-align: left; color: var(--white);
        }
        .quiz-opt-btn:hover { border-color: var(--yellow); background: var(--gray-1); }
        .quiz-opt-btn.selected { border-color: var(--yellow); background: rgba(232,255,0,0.05); }
        .opt-letter {
          width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
          background: var(--gray-3); border-radius: 4px; font-weight: 800; font-size: 0.8rem;
        }
        .selected .opt-letter { background: var(--yellow); color: var(--black); }
        .opt-text { font-family: var(--font-body); font-size: 1rem; }
      `}</style>
    </div>
  );
}
