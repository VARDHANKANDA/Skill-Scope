import { Router, type IRouter } from "express";
import { db, resumesTable, usersTable, skillsTable, projectsTable, githubProfilesTable, codingProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import {
  GetResumesResponse,
  CreateResumeBody,
  CreateResumeResponse,
  GetResumeParams,
  GetResumeResponse,
  UpdateResumeParams,
  UpdateResumeBody,
  UpdateResumeResponse,
  DeleteResumeParams,
  GenerateResumeParams,
  GenerateResumeResponse,
} from "@workspace/api-zod";
import { openai } from "../lib/openai";
import { rateLimit } from "../lib/rate-limit";

const router: IRouter = Router();

function formatResume(r: typeof resumesTable.$inferSelect) {
  return { ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
}

// GET /resumes
router.get("/resumes", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const resumes = await db.select().from(resumesTable).where(eq(resumesTable.userId, req.dbUserId!));
  res.json(GetResumesResponse.parse(resumes.map(formatResume)));
});

// POST /resumes
router.post("/resumes", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = CreateResumeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [resume] = await db.insert(resumesTable).values({ userId: req.dbUserId!, ...parsed.data, resumeScore: 0, atsScore: 0 }).returning();
  res.status(201).json(CreateResumeResponse.parse(formatResume(resume)));
});

// GET /resumes/:id  — scoped to owner
router.get("/resumes/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetResumeParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [resume] = await db.select().from(resumesTable).where(
    and(eq(resumesTable.id, params.data.id), eq(resumesTable.userId, req.dbUserId!))
  );
  if (!resume) { res.status(404).json({ error: "Resume not found" }); return; }
  res.json(GetResumeResponse.parse(formatResume(resume)));
});

// PATCH /resumes/:id  — scoped to owner
router.patch("/resumes/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateResumeParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateResumeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(resumesTable).set(parsed.data).where(
    and(eq(resumesTable.id, params.data.id), eq(resumesTable.userId, req.dbUserId!))
  ).returning();
  if (!updated) { res.status(404).json({ error: "Resume not found" }); return; }
  res.json(UpdateResumeResponse.parse(formatResume(updated)));
});

// DELETE /resumes/:id  — scoped to owner
router.delete("/resumes/:id", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteResumeParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [deleted] = await db.delete(resumesTable).where(
    and(eq(resumesTable.id, params.data.id), eq(resumesTable.userId, req.dbUserId!))
  ).returning({ id: resumesTable.id });
  if (!deleted) { res.status(404).json({ error: "Resume not found" }); return; }
  res.sendStatus(204);
});

// POST /resumes/:id/generate  — scoped to owner, rate limited to 5/hour per user
router.post("/resumes/:id/generate", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GenerateResumeParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const userId = req.dbUserId!;

  if (!rateLimit(`generate:${userId}`, 5, 60 * 60 * 1000)) {
    res.status(429).json({ error: "Too many generate requests. Try again in an hour." });
    return;
  }

  const [resume] = await db.select().from(resumesTable).where(
    and(eq(resumesTable.id, params.data.id), eq(resumesTable.userId, userId))
  );
  if (!resume) { res.status(404).json({ error: "Resume not found" }); return; }

  // Gather user context
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const [github] = await db.select().from(githubProfilesTable).where(eq(githubProfilesTable.userId, userId));
  const skills = await db.select().from(skillsTable).where(eq(skillsTable.userId, userId)).limit(15);
  const projects = await db.select().from(projectsTable).where(eq(projectsTable.userId, userId)).limit(5);
  const codingProfiles = await db.select().from(codingProfilesTable).where(eq(codingProfilesTable.userId, userId));

  const totalProblems = codingProfiles.reduce((a, p) => a + p.problemsSolved, 0);
  const topSkills = [...skills].sort((a, b) => b.score - a.score);

  const context = `
Developer: ${user?.name ?? "Developer"}
Email: ${user?.email ?? "user@example.com"}
Location: ${user?.location ?? "India"}
College: ${user?.college ?? "Not specified"}
Graduation Year: ${user?.graduationYear ?? "2024"}
Bio: ${user?.bio ?? ""}

GitHub: @${github?.username ?? "N/A"} | ${github?.totalRepos ?? 0} repos | ${github?.stars ?? 0} stars | ${github?.commits ?? 0} commits
Top Language: ${github?.topLanguage ?? "N/A"}

Skills (top by proficiency): ${topSkills.slice(0, 10).map(s => `${s.name} (${s.score}/100)`).join(", ")}

Projects: ${projects.map(p => `${p.name}: ${p.description ?? ""} [${((p.techStack as string[]) ?? []).join(", ")}]`).join("\n")}

Coding: ${codingProfiles.map(p => `${p.platform}: ${p.problemsSolved} solved, rating ${p.rating ?? "N/A"}`).join(", ")}
Total problems solved: ${totalProblems}

Resume template: ${resume.template}
`.trim();

  let generatedContent: Record<string, unknown> = {};
  let resumeScore = 70;
  let atsScore = 75;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2000,
      messages: [{
        role: "system",
        content: `You are an expert resume writer for software engineers, specializing in ATS-optimized resumes for Indian tech companies (FAANG, unicorns, product companies).

Generate a complete, professional resume JSON from the developer's real data. Be ATS-friendly, use strong action verbs, quantify achievements where possible, tailor to the ${resume.template} template.

Return ONLY valid JSON with this structure:
{
  "profile": { "name": string, "email": string, "phone": string, "location": string, "linkedin": string, "github": string, "portfolio": string },
  "summary": string,
  "education": [{ "degree": string, "institution": string, "year": string, "gpa": string, "achievements": string[] }],
  "skills": { "languages": string[], "frameworks": string[], "databases": string[], "tools": string[], "cloud": string[] },
  "projects": [{ "name": string, "description": string, "tech": string[], "link": string, "highlights": string[] }],
  "experience": [{ "company": string, "role": string, "duration": string, "points": string[] }],
  "achievements": string[],
  "certifications": string[],
  "resumeScore": number,
  "atsScore": number
}`,
      }, {
        role: "user",
        content: `Generate a resume for this developer:\n\n${context}`,
      }],
      response_format: { type: "json_object" },
    }, { signal: controller.signal as AbortSignal });
    clearTimeout(timeout);

    const raw2 = completion.choices[0]?.message?.content ?? "{}";
    const parsed2 = JSON.parse(raw2);
    resumeScore = Math.min(100, Math.max(0, parsed2.resumeScore ?? 78));
    atsScore = Math.min(100, Math.max(0, parsed2.atsScore ?? 82));
    const { resumeScore: _rs, atsScore: _as, ...contentOnly } = parsed2;
    generatedContent = contentOnly;
  } catch {
    // Fallback: structured content from real profile data
    const skillGroups = {
      languages: topSkills.filter(s => ["TypeScript", "JavaScript", "Python", "Java", "Go", "C++", "Rust", "Kotlin"].includes(s.name)).map(s => s.name),
      frameworks: topSkills.filter(s => ["React", "Node.js", "Express", "FastAPI", "Spring", "Django"].includes(s.name)).map(s => s.name),
      databases: topSkills.filter(s => ["PostgreSQL", "MySQL", "MongoDB", "Redis"].includes(s.name)).map(s => s.name),
      tools: topSkills.filter(s => ["Docker", "Git", "Kubernetes", "Linux"].includes(s.name)).map(s => s.name),
      cloud: topSkills.filter(s => ["AWS", "GCP", "Azure"].includes(s.name)).map(s => s.name),
    };
    generatedContent = {
      profile: { name: user?.name ?? "Developer", email: user?.email ?? "", phone: "", location: user?.location ?? "India", linkedin: "", github: github?.username ? `github.com/${github.username}` : "", portfolio: "" },
      summary: `Software engineer with expertise in ${skillGroups.languages.slice(0, 3).join(", ")}. ${totalProblems > 0 ? `Solved ${totalProblems}+ competitive programming problems.` : ""}`.trim(),
      education: [{ degree: "B.Tech Computer Science", institution: user?.college ?? "Engineering College", year: String(user?.graduationYear ?? "2024"), gpa: "", achievements: [] }],
      skills: skillGroups,
      projects: projects.slice(0, 4).map(p => ({ name: p.name, description: p.description ?? "", tech: (p.techStack as string[]) ?? [], link: p.htmlUrl ?? "", highlights: [] })),
      experience: [],
      achievements: totalProblems > 0 ? [`Solved ${totalProblems}+ problems across LeetCode, Codeforces and other platforms`] : [],
      certifications: [],
    };
  }

  const [updated] = await db.update(resumesTable).set({ content: generatedContent, resumeScore, atsScore }).where(
    and(eq(resumesTable.id, params.data.id), eq(resumesTable.userId, userId))
  ).returning();
  res.json(GenerateResumeResponse.parse(formatResume(updated!)));
});

export default router;
