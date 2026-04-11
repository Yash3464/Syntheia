const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  createLearningPath: (user, moduleId, level, pace) =>
    request(`/learning-paths/?module_id=${moduleId}&level=${level}&pace=${pace}`, {
      method: 'POST',
      body: JSON.stringify(user),
    }),

  getLearningPath: (planId) =>
    request(`/learning-paths/${planId}`),

  getProgress: (planId) =>
    request(`/learning-paths/${planId}/progress`),

  markDayCompleted: (planId, dayNumber, actualTimeMinutes) =>
    request(
      `/learning-paths/${planId}/days/${dayNumber}/complete${actualTimeMinutes ? `?actual_time_minutes=${actualTimeMinutes}` : ''}`,
      { method: 'POST' }
    ),

  reschedulePlan: (planId, missedDays, completedDays = [], newPace = null) =>
    request(`/learning-paths/${planId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ missed_days: missedDays, completed_days: completedDays, new_pace: newPace }),
    }),

  getAvailableModules: () =>
    request('/learning-paths/modules/available'),

  getQuizQuestions: (topics, count = 3) =>
    request(`/quiz/questions?topics=${encodeURIComponent(topics.join(','))}&count=${count}`),

  submitQuiz: (answers) =>
    request('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(answers),
    }),
};