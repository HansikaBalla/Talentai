# TalentAI — AI Resume Screening & Candidate Ranking System

> A full-stack, production-ready AI recruiting platform. Upload resumes, auto-parse with NLP, and rank candidates by job fit — all in real time.

![TalentAI](https://img.shields.io/badge/TalentAI-v1.0.0-c0c1ff?style=flat-square)
![Node](https://img.shields.io/badge/Node.js-20.x-success?style=flat-square&logo=node.js)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat-square&logo=mongodb)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) or MongoDB Atlas URI

### 1. Clone & Install
```bash
cd talentai-app
npm install          # installs concurrently at root
npm run install:all  # installs backend + frontend dependencies
```

### 2. Configure Environment
```bash
# .env is already created. Update if needed:
# MONGODB_URI=mongodb://localhost:27017/talentai
# JWT_SECRET=<change_this>
```

### 3. Seed the Database (optional but recommended)
```bash
npm run seed
# Creates 2 users, 5 jobs, 30 candidates with AI scores
# 🔑 admin@talentai.com / Admin@12345
# 🔑 recruiter@talentai.com / Recruiter@12345
```

### 4. Start Development
```bash
npm run dev
# API: http://localhost:5000
# UI:  http://localhost:5173
```

---

## 🏗️ Project Structure

```
talentai-app/
├── backend/
│   ├── models/           # User, Job, Candidate, Resume schemas
│   ├── routes/           # auth, jobs, candidates, resumes, analytics, admin
│   ├── middleware/        # JWT auth guards, Multer upload, error handler
│   ├── services/
│   │   ├── aiRanking.js  # NLP scoring engine (TF-IDF + weighted match)
│   │   └── resumeParser.js # PDF/DOCX text extraction
│   ├── seed/seedData.js  # Database seeder
│   └── server.js         # Express entry point
├── frontend/
│   └── src/
│       ├── api/client.ts   # Axios + JWT refresh interceptor
│       ├── store/          # Zustand auth + UI state
│       ├── components/
│       │   ├── layout/     # Sidebar, TopBar, AppLayout
│       │   └── ui/         # ScoreRing, SkillBadge, StatusBadge, GlassCard...
│       └── pages/          # 12 fully functional pages
├── .env                    # Environment variables
└── package.json            # Concurrent dev scripts
```

---

## 🤖 AI Scoring Algorithm

Each candidate receives a **composite match score (0–100)** calculated as:

| Dimension | Weight | Method |
|-----------|--------|--------|
| Skills Match | 40% | Skill normalization + alias matching |
| Experience Match | 25% | Sigmoid ratio: actual/required years |
| Education Match | 15% | Degree level mapping (HS→PhD: 1–5) |
| Keyword Density | 20% | TF-IDF on job description vs resume text |

---

## 🔐 Auth Flow

- **Register** → hashed password (bcrypt 12 rounds) → JWT access token (15min) + refresh token (7d)
- **Refresh** → swap refresh token for new pair (rotation)
- **Logout** → invalidates refresh token from DB

### Demo Accounts (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@talentai.com | Admin@12345 |
| Recruiter | recruiter@talentai.com | Recruiter@12345 |

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login → JWT tokens |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/jobs` | List jobs with filters |
| POST | `/api/jobs` | Create job |
| POST | `/api/jobs/:id/rank` | Trigger AI ranking |
| POST | `/api/resumes/upload` | Upload PDF/DOCX |
| GET | `/api/candidates` | List candidates |
| GET | `/api/analytics/overview` | Dashboard KPIs |
| GET | `/api/analytics/funnel` | Hiring funnel |

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend && npm run build
vercel deploy
```

### Backend → Railway
```bash
# In Railway: connect this repo, set root to /backend
# Add all .env variables in Railway dashboard
# MongoDB: use Railway's MongoDB plugin or Atlas
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v3, TanStack Query, Zustand |
| Charts | Recharts |
| Backend | Node.js 20, Express 4, Mongoose |
| Auth | JWT, bcryptjs |
| File Upload | Multer (PDF/DOCX) |
| Resume Parsing | pdf-parse, mammoth |
| AI Scoring | natural (TF-IDF), custom NLP |
