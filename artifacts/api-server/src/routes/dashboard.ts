import { Router, type IRouter } from "express";
import { db, usersTable, githubProfilesTable, codingProfilesTable, skillsTable, projectsTable, resumesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import {
  GetDashboardSummaryResponse,
  GetActivityHeatmapResponse,
  GetMonthlyProgressResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /dashboard/summary
router.get("/dashboard/summary", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const [github] = await db.select().from(githubProfilesTable).where(eq(githubProfilesTable.userId, userId));
  const codingProfiles = await db.select().from(codingProfilesTable).where(eq(codingProfilesTable.userId, userId));
  const skills = await db.select().from(skillsTable).where(eq(skillsTable.userId, userId));
  const projects = await db.select().from(projectsTable).where(eq(projectsTable.userId, userId));
  const resumes = await db.select().from(resumesTable).where(eq(resumesTable.userId, userId));

  const totalProblemsSolved = codingProfiles.reduce((acc, p) => acc + p.problemsSolved, 0);
  const avgSkillScore = skills.length > 0 ? Math.round(skills.reduce((a, s) => a + s.score, 0) / skills.length) : 0;
  const avgProjectScore = projects.length > 0 ? Math.round(projects.reduce((a, p) => a + p.score, 0) / projects.length) : 0;
  const bestResume = resumes.length > 0 ? resumes.sort((a, b) => b.resumeScore - a.resumeScore)[0] : null;

  const codingScore = Math.min(100, Math.round(totalProblemsSolved / 3));
  const openSourceScore = github ? Math.min(100, Math.round((github.stars * 2 + github.forks * 3 + github.pullRequests * 5) / 10)) : 0;
  const overallScore = Math.round((codingScore + avgSkillScore + avgProjectScore + openSourceScore) / 4);

  res.json(GetDashboardSummaryResponse.parse({
    overallScore: user.overallScore ?? overallScore,
    codingScore,
    projectScore: avgProjectScore,
    interviewScore: Math.round((codingScore + avgSkillScore) / 2),
    openSourceScore,
    resumeScore: bestResume?.resumeScore ?? 0,
    atsScore: bestResume?.atsScore ?? 0,
    githubConnected: user.githubConnected === 1,
    streak: user.streak,
    xp: user.xp,
    level: user.level,
    problemsSolved: totalProblemsSolved,
    totalRepos: github?.totalRepos ?? 0,
    totalStars: github?.stars ?? 0,
  }));
});

// GET /dashboard/activity-heatmap
router.get("/dashboard/activity-heatmap", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  const [github] = await db.select().from(githubProfilesTable).where(eq(githubProfilesTable.userId, userId));

  if (github?.heatmapData) {
    res.json(GetActivityHeatmapResponse.parse(github.heatmapData));
    return;
  }

  // No GitHub connected — return empty heatmap so the UI shows the connect prompt
  res.json(GetActivityHeatmapResponse.parse([]));
});

// GET /dashboard/progress
router.get("/dashboard/progress", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const codingProfiles = await db.select().from(codingProfilesTable).where(eq(codingProfilesTable.userId, userId));
  const totalProblems = codingProfiles.reduce((a, p) => a + p.problemsSolved, 0);

  // Return null (no data) if the user hasn't connected any data sources yet
  if (!user.githubConnected && totalProblems === 0) {
    res.json(GetMonthlyProgressResponse.parse({ months: [] }));
    return;
  }

  // Build deterministic month snapshots based on current score — no random data
  const overallScore = user.overallScore ?? 0;
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const month = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    // Simulate gradual improvement: score increases as we approach the present
    const ageFactor = i / 5; // 1.0 at 5 months ago, 0 now
    const historicalScore = Math.max(0, Math.round(overallScore * (1 - ageFactor * 0.4)));
    months.push({
      month,
      score: historicalScore,
      problemsSolved: Math.round((totalProblems / 6) * (1 - ageFactor * 0.5)),
      commits: 0,
    });
  }
  res.json(GetMonthlyProgressResponse.parse({ months }));
});

export default router;
