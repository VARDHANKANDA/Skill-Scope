import { Router, type IRouter } from "express";
import { db, goalsTable, skillsTable, codingProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import {
  GetRoadmapResponse,
  GetRoadmapGoalsResponse,
  CompleteGoalParams,
  CompleteGoalResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /roadmap
router.get("/roadmap", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  const codingProfiles = await db.select().from(codingProfilesTable).where(eq(codingProfilesTable.userId, userId));
  const skills = await db.select().from(skillsTable).where(eq(skillsTable.userId, userId));
  const totalProblems = codingProfiles.reduce((a, p) => a + p.problemsSolved, 0);
  const completedGoals = await db.select().from(goalsTable).where(and(eq(goalsTable.userId, userId), eq(goalsTable.isCompleted, 1)));
  const progressPercent = Math.min(100, Math.round((totalProblems / 500) * 100));

  const hasBackend = skills.some(s => s.category === "Backend" && s.score > 60);
  const hasCloud = skills.some(s => s.category === "Cloud" && s.score > 50);
  const hasAIML = skills.some(s => s.category === "AI/ML" && s.score > 50);

  const currentLevel = hasBackend ? "Intermediate Full-Stack Developer" : "Junior Frontend Developer";

  let targetRole = "Senior Software Engineer at Product Company";
  if (hasAIML) targetRole = "Senior AI/ML Engineer at Product Company";
  else if (hasCloud) targetRole = "Senior Backend Engineer (Cloud-Native)";
  else if (!hasBackend) targetRole = "Senior Frontend Engineer at Product Company";

  res.json(GetRoadmapResponse.parse({
    currentLevel,
    targetRole,
    progressPercent,
    phases: [
      {
        phase: 1,
        title: "Strengthen DSA Foundation",
        isCompleted: totalProblems >= 150,
        items: ["Complete 150 LeetCode problems", "Master recursion & backtracking", "Learn graph algorithms (BFS, DFS, Dijkstra)", "Practice binary search patterns"],
      },
      {
        phase: 2,
        title: "Master System Design",
        isCompleted: totalProblems >= 300,
        items: ["Read DDIA (Designing Data-Intensive Applications)", "Design 5 classic systems (URL shortener, rate limiter, etc.)", "Learn CAP theorem and eventual consistency", "Study microservices vs monolith tradeoffs"],
      },
      {
        phase: 3,
        title: "Build Production Projects",
        isCompleted: completedGoals.length >= 5,
        items: ["Build and deploy 2 full-stack projects", "Add CI/CD pipelines with GitHub Actions", "Implement observability (logging, metrics, tracing)", "Get a project to 50+ GitHub stars"],
      },
      {
        phase: 4,
        title: "Interview Preparation",
        isCompleted: false,
        items: ["Complete 50 mock interviews on Pramp", "Record yourself solving problems", "Prepare 10 behavioral stories (STAR format)", "Research target companies thoroughly"],
      },
      {
        phase: 5,
        title: "Ready for Placement",
        isCompleted: false,
        items: ["Apply to 30+ companies", "Optimize LinkedIn and resume", "Attend tech meetups and hackathons", "Build recruiter network on LinkedIn"],
      },
    ],
  }));
});

// GET /roadmap/goals — returns user's real goals only (no seeding)
router.get("/roadmap/goals", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  const goals = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));

  const daily = goals.filter(g => g.type === "daily").map(g => ({ ...g, isCompleted: g.isCompleted === 1 }));
  const weekly = goals.filter(g => g.type === "weekly").map(g => ({ ...g, isCompleted: g.isCompleted === 1 }));
  const monthly = goals.filter(g => g.type === "monthly").map(g => ({ ...g, isCompleted: g.isCompleted === 1 }));

  res.json(GetRoadmapGoalsResponse.parse({ daily, weekly, monthly }));
});

// PATCH /roadmap/goals/:id/complete
router.patch("/roadmap/goals/:id/complete", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CompleteGoalParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [goal] = await db
    .update(goalsTable)
    .set({ isCompleted: 1 })
    .where(and(eq(goalsTable.id, params.data.id), eq(goalsTable.userId, req.dbUserId!)))
    .returning();
  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }
  res.json(CompleteGoalResponse.parse({ ...goal, isCompleted: goal.isCompleted === 1 }));
});

export default router;
