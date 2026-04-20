<div align="center">

# ⚡ SYNTHEIA
### AI-Powered Learning Navigator

**Plan smarter. Learn faster. Stay on track.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-syntheia--deploy.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://syntheia-deploy.vercel.app)
[![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)

</div>

---

## 📖 Overview

**Syntheia** is a full-stack AI learning platform that generates personalized, day-by-day study plans for any programming topic. Users answer a short onboarding quiz, and Syntheia creates a structured curriculum — complete with daily goals, quizzes, progress tracking, and an intelligent AI tutor available at every step.

> 🌐 **Try it live:** [https://syntheia-deploy.vercel.app](https://syntheia-deploy.vercel.app)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **AI Plan Generation** | Gemini-powered curriculum creation based on your topic, level, and pace |
| 📅 **Calendar View** | Visual weekly calendar showing every day of your learning journey |
| ✅ **Day Completion + Quiz** | Each day unlocks a short quiz before being marked complete |
| 📊 **Progress Tracking** | Real-time completion percentage, streaks, and milestone tracking |
| 🔁 **Smart Reschedule** | Two modes: shift all remaining days forward (+ buffer days) or requeue missed days to end |
| 🤖 **AI Tutor (Syntheia Assistant)** | Context-aware chat assistant that knows your current plan and topic |
| 🔐 **Authentication** | Supabase Auth with persistent sessions and local-first offline fallback |
| 🌙 **Dark Mode Design** | Premium dark UI with yellow accent, monospace typography, micro-animations |

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| [React](https://react.dev) | 18 | UI framework |
| [Vite](https://vitejs.dev) | 5 | Build tool & dev server |
| [Framer Motion](https://www.framer.com/motion/) | 11 | Animations & transitions |
| [Supabase JS](https://supabase.com/docs/reference/javascript) | 2 | Auth & database client |
| Vanilla CSS | — | Styling (no framework) |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| [FastAPI](https://fastapi.tiangolo.com) | 0.110 | REST API framework |
| [Pydantic](https://docs.pydantic.dev) | 2.6 | Data validation & models |
| [httpx](https://www.python-httpx.org) | 0.27 | Async HTTP client (Gemini REST calls) |
| [Supabase Python](https://supabase.com/docs/reference/python) | 2.4 | Database persistence |
| [uvicorn](https://www.uvicorn.org) | 0.27 | ASGI server |

### Infrastructure

| Service | Purpose |
|---|---|
| [Vercel](https://vercel.com) | Hosting — frontend (static) + backend (serverless Python) |
| [Supabase](https://supabase.com) | PostgreSQL database + Auth |
| [Google Gemini API](https://ai.google.dev) | AI curriculum generation + chat tutor |

---

## 🗂 Project Structure

```
Syntheia/
├── api/
│   └── index.py              # Vercel serverless entry point
├── src/                      # React frontend
│   ├── components/           # Shared components (QuizModal, AiAssistant, etc.)
│   ├── context/
│   │   └── AppContext.jsx    # Global state (plan, user, navigation)
│   ├── pages/                # Screen components
│   │   ├── SplashScreen.jsx
│   │   ├── WelcomeScreen.jsx
│   │   ├── OnboardingScreen.jsx
│   │   ├── PlanPreviewScreen.jsx
│   │   ├── DashboardScreen.jsx
│   │   ├── CalendarViewScreen.jsx
│   │   ├── ProgressScreen.jsx
│   │   └── RescheduleScreen.jsx
│   └── services/
│       └── api.js            # API client (all backend calls)
├── backend/
│   └── app/
│       ├── api/endpoints/    # Route handlers (learning_path, chat, etc.)
│       ├── core/             # Business logic (planner, rescheduler)
│       ├── models/           # Pydantic models (LearningPath, DailyTask)
│       └── services/         # Service layer (PlanService)
├── database/
│   ├── connection.py         # Supabase client init
│   └── schema.sql            # PostgreSQL schema
├── vercel.json               # Deployment config (rewrites + function config)
├── requirements.txt          # Python dependencies
└── package.json              # Node dependencies + scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.11
- A [Supabase](https://supabase.com) project
- A [Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone the repository

```bash
git clone https://github.com/Yash3464/Syntheia.git
cd Syntheia
```

### 2. Install dependencies

```bash
# Install all (frontend + backend)
npm run install-all

# Or separately:
npm install                          # frontend
pip install -r requirements.txt      # backend
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# Supabase (backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Supabase (frontend — must be prefixed with VITE_)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Set up the database

Run the schema against your Supabase project:

```bash
# Via Supabase dashboard SQL editor, paste contents of:
database/schema.sql
```

### 5. Run locally

```bash
# Start frontend (http://localhost:5173)
npm run dev

# Start backend in a separate terminal (http://localhost:8000)
npm run backend
```

---

## 🌐 Deployment (Vercel)

The project is a **monorepo** configured for zero-config Vercel deployment.

### Required environment variables in Vercel dashboard

| Variable | Environment | Description |
|---|---|---|
| `SUPABASE_URL` | All | Supabase project URL |
| `SUPABASE_ANON_KEY` | All | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | All | Supabase service role key (backend only) |
| `VITE_SUPABASE_URL` | Production + Preview | Supabase URL (baked into frontend at build time) |
| `VITE_SUPABASE_ANON_KEY` | Production + Preview | Supabase anon key (baked into frontend at build time) |
| `GEMINI_API_KEY` | All | Google Gemini API key |

> ⚠️ `VITE_` prefixed variables are **baked in at build time**. Any change requires a **manual redeploy** in the Vercel dashboard.

### Deploy

```bash
# Connect the repo to Vercel, then push to trigger a deployment:
git push origin main
```

---

## 📐 Architecture

```
Browser (React SPA)
       │
       │  HTTPS
       ▼
  Vercel Edge
  ┌────────────────────────────────┐
  │  Static Frontend (React/Vite) │
  │  /api/* → Python Serverless   │
  └────────────────────────────────┘
       │
       ├──→ Supabase (Auth + PostgreSQL)
       └──→ Google Gemini API (AI)
```

**Data flow:**
1. User completes onboarding → frontend POSTs to `/api/v1/learning-paths/`
2. FastAPI calls Gemini to generate a curriculum → saved to Supabase
3. Plan stored in `localStorage` for instant offline access
4. Daily progress synced back to Supabase on every action

---

## 🔁 Reschedule System

Syntheia includes a smart, two-mode rescheduler:

| Mode | How it Works |
|---|---|
| **Shift Forward** | Inserts N buffer/rest days before all pending content days. Calendar dates shift N days forward. Total days increases by N. |
| **Requeue Missed** | Selected days are marked `missed` in their original slots. Their content is cloned as brand-new days appended at the end. Total days increases. |

Both modes preserve the topic learning sequence and never modify completed days.

---

## 👥 Contributors

- **Rhythm Singhal**
- **Yashwardhan Singh**
- **Prathamesh Bhandare**


---

<div align="center">

**Built with ⚡ by the Syntheia team**

[Live Demo](https://syntheia-deploy.vercel.app)

</div>
