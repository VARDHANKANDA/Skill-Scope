# SkillScope

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen)](#)

> **The Developer Intelligence Platform for Indian Software Engineers.**  
> Connect your GitHub, LeetCode, and Codeforces. Get AI-verified skills, an ATS-ready resume, and a public developer profile that makes top recruiters reach out to *you*.

---

## ✨ Features

| Feature | Description |
|---|---|
| **GitHub Intelligence** | Deep analysis of repositories — language breakdown, commit heatmaps, code quality scores |
| **Competitive Coding** | Aggregated stats from LeetCode, Codeforces, and CodeChef in one dashboard |
| **Skill Matrix** | AI-verified skill assessment with proficiency scores per technology |
| **Project Intelligence** | Automated code review: architecture analysis, maintainability index, security score |
| **Resume Builder** | ATS-optimised resume generation with multiple templates, PDF export |
| **Interview Prep** | Readiness score based on problem-solving history and project portfolio |
| **Learning Roadmap** | Personalised multi-phase roadmap from current level to target role |
| **AI Career Coach** | Conversational AI mentor powered by OpenAI for personalised guidance |
| **Leaderboard** | Global developer rankings by XP, score, and activity |
| **Recruiter Dashboard** | Verified talent search with bookmark and filtering for recruiters |
| **Public Profile** | Shareable developer profile URL for job applications |
| **Gamification** | XP, levels, streaks, and rarity-tiered achievement badges |
| **Dark / Light Theme** | Full theme support with preference persistence — no flash on load |

---

## 📸 Screenshots

> _Screenshots coming soon. Follow the [Run Locally](#run-locally) guide to view the dashboard live in your browser._

---

## 🛠 Tech Stack

### Frontend
- **React 18** + **TypeScript** — component-based SPA
- **Vite 7** — lightning-fast dev server and build tool
- **Tailwind CSS v4** — utility-first styling with CSS custom properties
- **shadcn/ui** — accessible, composable component library
- **TanStack Query v5** — server state management and caching
- **Wouter** — lightweight client-side routing
- **Recharts** — data visualisation (charts, heatmaps)
- **Orval** — OpenAPI → TypeScript client codegen

### Backend
- **Express 5** — HTTP API server (TypeScript, ESM)
- **Drizzle ORM** — type-safe PostgreSQL queries
- **Zod** — runtime request/response validation
- **Pino** — structured JSON logging
- **esbuild** — fast production bundling

### Database
- **PostgreSQL 15** — primary relational database
- **Drizzle Kit** — schema migrations

### Authentication
- **Clerk** — managed auth (social login, email/password, MFA, session management)

### Deployment
- **Docker / Cloud VPS** — monorepo hosting, PostgreSQL integration
- Monorepo package routing (frontend served at `/` and API served at `/api`)

---

## 🚀 Installation

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- A [Clerk](https://clerk.com/) account

### Clone & Install

```bash
git clone https://github.com/your-username/skillscope.git
cd skillscope
pnpm install
```

### Environment Variables

Create the following secrets in your environment (or `.env` files):

| Variable | Where | Description |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend | Clerk publishable key |
| `CLERK_SECRET_KEY` | API | Clerk secret key |
| `CLERK_PUBLISHABLE_KEY` | API | Clerk publishable key |
| `DATABASE_URL` | API | PostgreSQL connection string |
| `OPENAI_API_KEY` | API | OpenAI API key (for AI Career Coach) |

### Run Locally

```bash
# Start the frontend (Vite dev server)
pnpm --filter @workspace/skillscope run dev

# Start the API server (Express)
pnpm --filter @workspace/api-server run dev

# Run database migrations
pnpm --filter @workspace/db run migrate
```

---

## 📁 Folder Structure

```
skillscope/
├── artifacts/
│   ├── skillscope/           # React + Vite frontend
│   │   └── src/
│   │       ├── components/   # Shared UI components
│   │       ├── contexts/     # React contexts (theme, etc.)
│   │       ├── hooks/        # Custom hooks
│   │       ├── lib/          # Utilities, API client config
│   │       └── pages/        # Route-level page components
│   │
│   └── api-server/           # Express 5 API server
│       └── src/
│           ├── middlewares/  # Auth, error handling
│           └── routes/       # API route handlers
│
├── lib/
│   ├── db/                   # Drizzle ORM schema + migrations
│   ├── api-spec/             # OpenAPI 3.1 specification
│   ├── api-client-react/     # Orval-generated React Query hooks
│   └── api-zod/              # Orval-generated Zod schemas
│
├── pnpm-workspace.yaml
└── README.md
```

---

## 🔌 API Overview

All endpoints are prefixed with `/api` and require a valid Clerk session cookie.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/me` | Current user profile |
| `PUT` | `/api/users/me` | Update profile fields |
| `GET` | `/api/dashboard/summary` | Aggregated dashboard stats |
| `GET` | `/api/github/profile` | GitHub profile data |
| `GET` | `/api/github/repos` | Repository list with analysis |
| `GET` | `/api/coding-profiles` | Coding platform profiles |
| `GET` | `/api/coding-profiles/aggregate` | Combined coding stats |
| `GET` | `/api/skills` | Skill assessments |
| `POST` | `/api/skills/analyze` | Trigger AI skill analysis |
| `GET` | `/api/projects` | User's analysed projects |
| `GET` | `/api/projects/:id` | Single project details |
| `GET` | `/api/resumes` | Saved resumes |
| `POST` | `/api/resumes` | Generate a new resume |
| `GET` | `/api/interview/readiness` | Interview readiness score |
| `GET` | `/api/roadmap` | Personalised learning roadmap |
| `GET` | `/api/roadmap/goals` | Daily / weekly / monthly goals |
| `PATCH` | `/api/roadmap/goals/:id/complete` | Mark a goal complete |
| `GET` | `/api/career-coach/messages` | Chat history |
| `POST` | `/api/career-coach/messages` | Send message to AI coach |
| `GET` | `/api/gamification/profile` | XP, level, badges |
| `GET` | `/api/gamification/leaderboard` | Global rankings |
| `GET` | `/api/public/profile/:username` | Public developer profile |
| `GET` | `/api/recruiter/search` | Search developers |

---

## 🗄 Database Overview

The schema is defined in `lib/db/src/schema/` using Drizzle ORM.

| Table | Description |
|---|---|
| `users` | Core user record (name, username, xp, streak, overall score) |
| `github_profiles` | Linked GitHub account data |
| `coding_profiles` | LeetCode / Codeforces / CodeChef stats |
| `skills` | Per-skill assessment scores and categories |
| `projects` | Analysed GitHub repositories |
| `resumes` | Generated resume documents |
| `badges` | Earned achievement badges (rarity: common → legendary) |
| `goals` | Daily / weekly / monthly roadmap goals |
| `career_coach_messages` | AI coach conversation history |
| `recruiter_bookmarks` | Recruiter-saved developer profiles |

---

## 🔨 Build Instructions

```bash
# Build frontend
pnpm --filter @workspace/skillscope run build

# Build API server
pnpm --filter @workspace/api-server run build

# Build all packages
pnpm -r run build

# Type-check all packages
pnpm -r exec tsc --noEmit

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-client-react run generate
pnpm --filter @workspace/api-zod run generate
```

---

## 🌐 Deployment

SkillScope can be deployed easily on any cloud provider (VPS, Render, Railway, Docker, or traditional hosting):

### Self-Hosted (VPS / Cloud)
1. **Build all packages**: Build the entire workspace:
   ```bash
   pnpm -r run build
   ```
2. **Database Migration**: Run database migrations using Drizzle:
   ```bash
   pnpm --filter @workspace/db run migrate
   ```
3. **Environment Setup**: Set the environment variables listed in the [Environment Variables](#environment-variables) section.
4. **Start the API Server**: Run the API server:
   ```bash
   node artifacts/api-server/dist/index.mjs
   ```
5. **Serve the Frontend**: Serve the static build output located in [artifacts/skillscope/dist/public/](artifacts/skillscope/dist/public/) using Nginx, Caddy, or a static hosting service.

---

## 🗺 Future Roadmap

- [ ] **Real-time notifications** via WebSockets
- [ ] **Company-specific preparation** packs (Google, Microsoft, Flipkart)
- [ ] **Peer code reviews** — connect developers for collaborative review
- [ ] **Mock interview scheduler** with video and automated feedback
- [ ] **Mobile app** (React Native / Expo)
- [ ] **AI resume tailoring** — match resume to specific job descriptions
- [ ] **College / batch leaderboards** — compete within your institution
- [ ] **Mentor matching** — connect with senior engineers for 1:1 guidance
- [ ] **Contest reminders** — calendar integration for upcoming contests
- [ ] **API rate limiting & abuse protection** for public endpoints

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests where applicable
4. Run the type-checker: `pnpm -r exec tsc --noEmit`
5. Commit with a descriptive message: `git commit -m "feat: add X"`
6. Push and open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---
## 👨‍💻 Author

**Kanda Saptha Sri Vardhan**

[![GitHub](https://img.shields.io/badge/GitHub-VARDHANKANDA-181717?style=for-the-badge&logo=github)](https://github.com/VARDHANKANDA)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Vardhan%20Kanda-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/vardhankanda)