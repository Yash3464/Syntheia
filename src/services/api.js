const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

async function request(path, options = {}, ignoreNotFound = false) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 30000); // 30-second timeout

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(id);

    if (!res.ok) {
      if (res.status === 404 && ignoreNotFound) {
        return null;
      }
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || 'Request failed');
    }

    return res.json();
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Server connection timed out. Is the backend running?');
    }
    throw error;
  }
}

export const api = {
  createLearningPath: (user, moduleId, level, pace) =>
    request(`/learning-paths/?module_id=${moduleId}&level=${level}&pace=${pace}`, {
      method: 'POST',
      body: JSON.stringify(user),
    }),

  getLearningPath: (planId) => {
    console.log(`🔍 Fetching plan data for ID: ${planId}`);
    if (!planId) {
      console.warn('⚠️ getLearningPath called without planId');
      throw new Error('Plan ID is required');
    }
    return request(`/learning-paths/${planId}`);
  },

  getUserPlan: (userId) => {
    console.log(`👤 Fetching active plan for user: ${userId}`);
    return request(`/learning-paths/user/${userId}`, {}, true);
  },

  getProgress: (planId) =>
    request(`/learning-paths/${planId}/progress`),

  markDayCompleted: (planId, dayNumber, planObj = null, actualTimeMinutes = null) => {
    console.log(`✅ Marking Day ${dayNumber} completed for plan ${planId} (Local-First Sync)`);
    return request(
      `/learning-paths/${planId}/days/${dayNumber}/complete${actualTimeMinutes ? `?actual_time_minutes=${actualTimeMinutes}` : ''}`,
      { 
        method: 'POST',
        body: planObj ? JSON.stringify(planObj) : null
      }
    );
  },

  reschedulePlan: (planId, missedDays, planObj = null, completedDays = [], newPace = null, shiftDays = 0) => {
    console.log(`📅 Rescheduling plan ${planId} (shiftDays=${shiftDays}, missed=${missedDays.length})`);
    return request(`/learning-paths/${planId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ 
        missed_days: missedDays, 
        completed_days: completedDays, 
        new_pace: newPace,
        plan_obj: planObj,
        shift_days: shiftDays
      }),
    });
  },

  getAvailableModules: () =>
    request('/learning-paths/modules/available'),

  getQuizQuestions: (topics, count = 3) =>
    request(`/quizzes/questions?topics=${encodeURIComponent(topics.join(','))}&count=${count}`),

  submitQuiz: (answers) =>
    request('/quizzes/submit', {
      method: 'POST',
      body: JSON.stringify(answers),
    }),

  sendChatMessage: (messages, appContext = null) =>
    request('/chat/tutor', {
      method: 'POST',
      body: JSON.stringify({ messages, app_context: appContext }),
    }),
};