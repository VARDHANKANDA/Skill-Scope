import { Router, type IRouter } from "express";
import { db, usersTable, skillsTable, projectsTable, githubProfilesTable, codingProfilesTable, badgesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetPublicProfileParams, GetPublicProfileResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /public/profile/:username
router.get("/public/profile/:username", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
  const params = GetPublicProfileParams.safeParse({ username: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, params.data.username));
  if (!user) {
    res.status(404).json({ error: "Developer not found" });
    return;
  }

  const [[github], skills, projects, codingProfiles, badges] = await Promise.all([
    db.select().from(githubProfilesTable).where(eq(githubProfilesTable.userId, user.id)),
    db.select().from(skillsTable).where(eq(skillsTable.userId, user.id)),
    db.select().from(projectsTable).where(eq(projectsTable.userId, user.id)),
    db.select().from(codingProfilesTable).where(eq(codingProfilesTable.userId, user.id)),
    db.select().from(badgesTable).where(eq(badgesTable.userId, user.id)),
  ]);

  res.json(GetPublicProfileResponse.parse({
    username: user.username ?? params.data.username,
    name: user.name ?? "Developer",
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    location: user.location,
    college: user.college,
    overallScore: user.overallScore ?? 0,
    skills,
    projects: projects.map(p => ({ ...p, techStack: (p.techStack as string[]) ?? [] })),
    githubProfile: github
      ? { ...github, weeklyHours: github.weeklyHours ? parseFloat(github.weeklyHours) : null }
      : null,
    codingProfiles: codingProfiles.map(p => ({ ...p, lastSynced: p.lastSynced?.toISOString() ?? null })),
    badges: badges.map(b => ({ ...b, earnedAt: b.earnedAt.toISOString() })),
  }));
});

export default router;
