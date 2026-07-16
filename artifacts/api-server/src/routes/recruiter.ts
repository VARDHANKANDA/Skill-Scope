import { Router, type IRouter } from "express";
import { db, usersTable, recruiterBookmarksTable, githubProfilesTable, skillsTable } from "@workspace/db";
import { eq, and, ilike, gte, sql } from "drizzle-orm";
import { requireAuth, requireRecruiter, type AuthedRequest } from "../middlewares/requireAuth";
import {
  SearchDevelopersQueryParams,
  SearchDevelopersResponse,
  GetRecruiterBookmarksResponse,
  AddRecruiterBookmarkBody,
  AddRecruiterBookmarkResponse,
  RemoveRecruiterBookmarkParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /recruiter/search
router.get("/recruiter/search", requireRecruiter, async (req: AuthedRequest, res): Promise<void> => {
  const params = SearchDevelopersQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = params.success ? (params.data.offset ?? 0) : 0;

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "student"))
    .limit(limit)
    .offset(offset);

  const developers = await Promise.all(users.map(async (u) => {
    const [github] = await db.select().from(githubProfilesTable).where(eq(githubProfilesTable.userId, u.id));
    const skills = await db.select().from(skillsTable).where(eq(skillsTable.userId, u.id));
    const topSkills = skills.sort((a, b) => b.score - a.score).slice(0, 4).map(s => s.name);

    return {
      userId: u.id,
      name: u.name ?? u.username ?? "Developer",
      avatarUrl: u.avatarUrl,
      location: u.location,
      college: u.college,
      overallScore: u.overallScore ?? 60,
      githubScore: github?.score ?? 0,
      codingScore: 0,
      interviewScore: 0,
      resumeScore: 0,
      topSkills: topSkills.length > 0 ? topSkills : ["JavaScript", "React", "Node.js"],
      username: u.username,
    };
  }));

  res.json(SearchDevelopersResponse.parse({ total: developers.length, developers }));
});

// GET /recruiter/bookmarks
router.get("/recruiter/bookmarks", requireRecruiter, async (req: AuthedRequest, res): Promise<void> => {
  const bookmarks = await db
    .select()
    .from(recruiterBookmarksTable)
    .where(eq(recruiterBookmarksTable.recruiterId, req.dbUserId!));

  const enriched = await Promise.all(bookmarks.map(async (b) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, b.bookmarkedUserId));
    const [github] = user ? await db.select().from(githubProfilesTable).where(eq(githubProfilesTable.userId, user.id)) : [undefined];
    const skills = user ? await db.select().from(skillsTable).where(eq(skillsTable.userId, user.id)) : [];
    const topSkills = skills.sort((a, b) => b.score - a.score).slice(0, 4).map(s => s.name);

    return {
      id: b.id,
      bookmarkedUserId: b.bookmarkedUserId,
      notes: b.notes,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
      bookmarkedUser: {
        userId: user?.id ?? b.bookmarkedUserId,
        name: user?.name ?? "Developer",
        avatarUrl: user?.avatarUrl ?? null,
        location: user?.location ?? null,
        college: user?.college ?? null,
        overallScore: user?.overallScore ?? 60,
        githubScore: github?.score ?? 0,
        codingScore: 0,
        interviewScore: 0,
        resumeScore: 0,
        topSkills: topSkills.length > 0 ? topSkills : ["JavaScript", "React"],
        username: user?.username ?? null,
      },
    };
  }));

  res.json(GetRecruiterBookmarksResponse.parse(enriched));
});

// POST /recruiter/bookmarks
router.post("/recruiter/bookmarks", requireRecruiter, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = AddRecruiterBookmarkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [bookmark] = await db.insert(recruiterBookmarksTable).values({
    recruiterId: req.dbUserId!,
    ...parsed.data,
    status: (parsed.data.status as typeof recruiterBookmarksTable.$inferInsert["status"]) ?? "saved",
  }).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.bookmarkedUserId));
  const [github] = user ? await db.select().from(githubProfilesTable).where(eq(githubProfilesTable.userId, user.id)) : [undefined];
  const skills = user ? await db.select().from(skillsTable).where(eq(skillsTable.userId, user.id)) : [];
  const topSkills = skills.sort((a, b) => b.score - a.score).slice(0, 4).map(s => s.name);

  res.status(201).json(AddRecruiterBookmarkResponse.parse({
    id: bookmark.id,
    bookmarkedUserId: bookmark.bookmarkedUserId,
    notes: bookmark.notes,
    status: bookmark.status,
    createdAt: bookmark.createdAt.toISOString(),
    bookmarkedUser: {
      userId: user?.id ?? bookmark.bookmarkedUserId,
      name: user?.name ?? "Developer",
      avatarUrl: user?.avatarUrl ?? null,
      location: user?.location ?? null,
      college: user?.college ?? null,
      overallScore: user?.overallScore ?? 60,
      githubScore: github?.score ?? 0,
      codingScore: 0,
      interviewScore: 0,
      resumeScore: 0,
      topSkills: topSkills.length > 0 ? topSkills : ["JavaScript", "React"],
      username: user?.username ?? null,
    },
  }));
});

// DELETE /recruiter/bookmarks/:userId
router.delete("/recruiter/bookmarks/:userId", requireRecruiter, async (req: AuthedRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const params = RemoveRecruiterBookmarkParams.safeParse({ userId: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(recruiterBookmarksTable).where(
    and(
      eq(recruiterBookmarksTable.recruiterId, req.dbUserId!),
      eq(recruiterBookmarksTable.bookmarkedUserId, Number(params.data.userId)),
    )
  );
  res.sendStatus(204);
});

export default router;
