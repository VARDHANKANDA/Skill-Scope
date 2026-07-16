import { Router, type IRouter } from "express";
import { db, projectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import {
  GetProjectsResponse,
  GetProjectParams,
  GetProjectResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /projects — returns only the authenticated user's real projects
router.get("/projects", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  const projects = await db.select().from(projectsTable).where(eq(projectsTable.userId, userId));

  res.json(GetProjectsResponse.parse(projects.map(p => ({
    ...p,
    techStack: (p.techStack as string[]) ?? [],
  }))));
});

// GET /projects/:id
router.get("/projects/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProjectParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, params.data.id), eq(projectsTable.userId, req.dbUserId!)));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(GetProjectResponse.parse({
    ...project,
    techStack: (project.techStack as string[]) ?? [],
    performanceSuggestions: (project.performanceSuggestions as string[]) ?? [],
    designPatterns: (project.designPatterns as string[]) ?? [],
    htmlUrl: project.htmlUrl,
    difficulty: project.difficulty,
    language: project.language,
  }));
});

export default router;
