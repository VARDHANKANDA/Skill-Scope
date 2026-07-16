import { Router, type IRouter } from "express";
import { db, usersTable, badgesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import {
  GetGamificationProfileResponse,
  GetLeaderboardResponse,
  GetLeaderboardQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const LEVEL_NAMES = ["Newcomer", "Explorer", "Apprentice", "Developer", "Engineer", "Senior Dev", "Lead", "Architect", "Principal", "Legend"];

function getLevelFromXp(xp: number) {
  return Math.min(9, Math.floor(xp / 500));
}
function getXpToNextLevel(xp: number) {
  const level = getLevelFromXp(xp);
  return (level + 1) * 500 - xp;
}

// GET /gamification/profile — returns real earned badges only (no seeding)
router.get("/gamification/profile", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  const badges = await db.select().from(badgesTable).where(eq(badgesTable.userId, userId));

  const xp = user.xp;
  const level = getLevelFromXp(xp);

  res.json(GetGamificationProfileResponse.parse({
    xp,
    level,
    levelName: LEVEL_NAMES[level],
    xpToNextLevel: getXpToNextLevel(xp),
    badges: badges.map(b => ({ ...b, earnedAt: b.earnedAt.toISOString() })),
    totalBadges: badges.length,
    streak: user.streak,
    longestStreak: user.streak,
  }));
});

// GET /gamification/leaderboard — returns only real users, no mock padding
router.get("/gamification/leaderboard", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const params = GetLeaderboardQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 20) : 20;

  const users = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.xp))
    .limit(limit);

  const entries = users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    name: u.name ?? u.username ?? "Developer",
    avatarUrl: u.avatarUrl,
    college: u.college,
    overallScore: u.overallScore ?? 0,
    xp: u.xp,
    level: getLevelFromXp(u.xp),
  }));

  res.json(GetLeaderboardResponse.parse(entries));
});

export default router;
