---
name: SkillScope project overview
description: Full-stack SaaS developer profile platform — stack, auth, DB schema, route map, and key gotchas
---

## Stack
- **Frontend**: React + Vite (`artifacts/skillscope`) — Clerk auth, TanStack Query, Wouter router, shadcn/ui, Recharts, Tailwind
- **Backend**: Express 5 API (`artifacts/api-server`) — Pino logger, Zod validation, Clerk middleware
- **Database**: PostgreSQL + Drizzle ORM (`lib/db/src/schema/`)
- **Codegen**: `lib/api-spec/openapi.yaml` → `lib/api-client-react` + `lib/api-zod` via Orval (`pnpm --filter @workspace/api-spec run codegen`)

## Auth
- Clerk. Frontend: `@clerk/react`. Backend: `@clerk/express` `requireAuth` middleware in `artifacts/api-server/src/middlewares/requireAuth.ts`
- JIT user sync on every login via `POST /api/users/me/sync` in `app-layout.tsx`
- Clerk session ID maps to internal DB user via `clerkId` column

## DB Schema (lib/db/src/schema/)
- `users`: id, clerkId, email, name, username, avatarUrl, bio, location, college, graduationYear, role, overallScore, xp, level, streak, githubConnected, createdAt, updatedAt
- `githubProfiles`: userId, username, totalRepos, stars, commits, followers, topLanguage, heatmapData, weeklyHours, languageStats
- `codingProfiles`: userId, platform, username, problemsSolved, rating, streak
- `projects`, `resumes`, `careerCoachMessages`, `roadmapGoals`, `recruiterBookmarks`

## Generated Types
- `DeveloperCard` type comes from `lib/api-client-react/src/generated/api.schemas.ts` (exported there, not in `api.ts`)
- `CodingProfileInputPlatform` and `ResumeInputTemplate` are const-enum objects in `api.schemas.ts` — state must be typed with these, and Radix Select `onValueChange` needs a cast: `(v) => setState(v as CodingProfileInputPlatform)`
- Re-run codegen after every OpenAPI change: `pnpm --filter @workspace/api-spec run codegen`

## Route Map (API)
- `GET /api/users/me` — current user profile
- `POST /api/users/me/sync` — JIT user creation/update
- `GET /api/dashboard/summary|activity-heatmap|progress` — dashboard data
- `GET/POST /api/coding/profiles` · `DELETE /api/coding/profiles/:id`
- `GET/POST/DELETE /api/resumes` · `POST /api/resumes/:id/generate`
- `GET/POST /api/projects` · `GET/PATCH/DELETE /api/projects/:id` (IDOR-scoped by userId)
- `GET/POST /api/career-coach/messages` · `DELETE /api/career-coach/messages`
- `GET /api/gamification/profile|leaderboard`
- `GET/POST/PATCH /api/roadmap` · `GET/POST/PATCH /api/roadmap/goals`
- `GET /api/recruiter/search|bookmarks` · `POST/DELETE /api/recruiter/bookmarks`
- `GET /api/public/:username` — public profile (githubProfile nullable)

## Key Gotchas & Decisions
- `GET /api/projects/:id` must scope by `userId` (IDOR fix): uses `and(eq(id), eq(userId))` + `and` imported from drizzle-orm
- `GET /api/public/:username` — `githubProfile` is nullable; do not 404 when GitHub not connected
- All heatmap/leaderboard/progress data is deterministic (no `Math.random()`); mock data uses seeded patterns only
- Bundle split: vendor-clerk (~306 KB), vendor-charts (~432 KB), vendor-pdf (~589 KB), app (~475 KB)
- `lib/db` must be `tsc`-built before `api-server` typecheck: `pnpm --filter @workspace/db run build`
- Global IP rate limiter (1000 req/15 min) applied before all `/api` routes in `app.ts`
- LeetCode streak fetches both calendar years for accuracy
- `SimpleMarkdown` component at `artifacts/skillscope/src/lib/simple-markdown.tsx` — lightweight renderer for AI chat (bold, italic, code, bullets, numbered lists, headings, fenced code blocks)

## Completed Hardening (in order)
1. Removed all `Math.random()` from backend routes (gamification, dashboard)
2. Scoped `completeGoal` and `GET /projects/:id` by userId (IDOR prevention)
3. Added AlertDialog for all destructive confirms (coding, resume, career-coach)
4. Per-goal loading state in roadmap (spinner on individual goal, not all disabled)
5. Landing page rewritten: hero, stats bar, company strip, how-it-works, 6-feature grid, 3 testimonials with salary, final CTA + footer
6. `DeveloperCard` dev prop properly typed (was `any`)
7. AI career-coach messages rendered through SimpleMarkdown (markdown aware)
8. Mobile nav integrated in header (Sheet/drawer)
