import { Router, type IRouter } from "express";
import { db, skillsTable, githubProfilesTable, codingProfilesTable, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import {
  GetSkillsResponse,
  GetSkillCategoriesResponse,
  AnalyzeSkillsResponse,
} from "@workspace/api-zod";
import { openai } from "../lib/openai";

const router: IRouter = Router();

const LANG_COLOR: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5", Java: "#b07219",
  "C++": "#f34b7d", Go: "#00ADD8", Rust: "#dea584", Kotlin: "#A97BFF", Swift: "#F05138",
  Ruby: "#701516", PHP: "#4F5D95", "C#": "#178600", Dart: "#00B4AB", Scala: "#c22d40",
  React: "#61dafb", "Node.js": "#68a063", Vue: "#41b883", Docker: "#2496ed",
  AWS: "#ff9900", PostgreSQL: "#336791", Redis: "#dc382d", GraphQL: "#e535ab",
  "REST APIs": "#25d366", Git: "#f34f29", "Tailwind CSS": "#38bdf8",
};

const CATEGORY_MAP: Record<string, string> = {
  TypeScript: "Frontend", JavaScript: "Frontend", React: "Frontend", Vue: "Frontend",
  "Next.js": "Frontend", "Tailwind CSS": "Frontend", CSS: "Frontend", HTML: "Frontend",
  "Node.js": "Backend", Python: "Backend", Java: "Backend", Go: "Backend",
  Rust: "Backend", "C++": "Backend", PHP: "Backend", Ruby: "Backend",
  "C#": "Backend", Scala: "Backend", Kotlin: "Backend",
  PostgreSQL: "Database", MySQL: "Database", MongoDB: "Database",
  Redis: "Database", "SQL Server": "Database",
  Docker: "DevOps", Kubernetes: "DevOps", "CI/CD": "DevOps",
  "GitHub Actions": "DevOps", Linux: "DevOps", Terraform: "DevOps",
  AWS: "Cloud", GCP: "Cloud", Azure: "Cloud",
  "Machine Learning": "AI/ML", PyTorch: "AI/ML", TensorFlow: "AI/ML",
  "REST APIs": "Backend", GraphQL: "Backend", gRPC: "Backend",
  Git: "Tools", Postman: "Tools", "VS Code": "Tools", Swift: "Mobile", Dart: "Mobile",
};

// GET /skills
router.get("/skills", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const skills = await db.select().from(skillsTable).where(eq(skillsTable.userId, req.dbUserId!));
  res.json(GetSkillsResponse.parse(skills));
});

// POST /skills/analyze  — uses OpenAI to infer skills from GitHub data + coding profiles
router.post("/skills/analyze", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  const [github] = await db.select().from(githubProfilesTable).where(eq(githubProfilesTable.userId, userId));
  const codingProfiles = await db.select().from(codingProfilesTable).where(eq(codingProfilesTable.userId, userId));
  const projects = await db.select().from(projectsTable).where(eq(projectsTable.userId, userId));

  let detectedSkills: Array<{
    name: string; category: string; score: number;
    confidence: "low" | "medium" | "high"; color: string; improvementSuggestion: string;
  }> = [];

  const langStats = github?.languageStats as Array<{ language: string; percentage: number }> | null;
  const totalProblems = codingProfiles.reduce((a, p) => a + p.problemsSolved, 0);

  if (github && langStats && langStats.length > 0) {
    // Build context for AI
    const techContext = [
      `GitHub languages: ${langStats.map(l => `${l.language} (${l.percentage}%)`).join(", ")}`,
      `Repos: ${github.totalRepos}, Stars: ${github.stars}, Commits: ${github.commits}`,
      projects.length > 0 ? `Projects tech stacks: ${projects.slice(0, 5).map(p => (p.techStack as string[] ?? []).join(", ")).filter(Boolean).join(" | ")}` : "",
      `Coding: ${totalProblems} problems solved across ${codingProfiles.map(p => p.platform).join(", ")}`,
    ].filter(Boolean).join("\n");

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 1500,
        messages: [{
          role: "system",
          content: "You are a developer skill analyzer. Given a developer's GitHub data, return a JSON array of their skills. Each skill: { name, score (0-100), confidence (low/medium/high), improvementSuggestion (one actionable sentence) }. Score based on language usage % and project evidence. Be realistic — don't inflate scores. Return 10-15 skills. ONLY return valid JSON array, nothing else.",
        }, {
          role: "user",
          content: `Analyze this developer's skills:\n${techContext}`,
        }],
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw);
      const aiSkills: Array<{ name: string; score: number; confidence: string; improvementSuggestion: string }> =
        Array.isArray(parsed) ? parsed : (parsed.skills ?? []);

      detectedSkills = aiSkills.map(s => ({
        name: s.name,
        category: CATEGORY_MAP[s.name] ?? "Tools",
        score: Math.max(0, Math.min(100, s.score)),
        confidence: (["low", "medium", "high"].includes(s.confidence) ? s.confidence : "medium") as "low" | "medium" | "high",
        color: LANG_COLOR[s.name] ?? "#8b949e",
        improvementSuggestion: s.improvementSuggestion ?? "",
      }));
    } catch {
      // Fall through to defaults
    }
  }

  // Fallback: infer from languages directly (no AI)
  if (detectedSkills.length === 0 && langStats && langStats.length > 0) {
    detectedSkills = langStats.slice(0, 8).map(l => ({
      name: l.language,
      category: CATEGORY_MAP[l.language] ?? "Backend",
      score: Math.min(95, Math.round(30 + l.percentage * 1.5)),
      confidence: l.percentage > 30 ? "high" as const : l.percentage > 10 ? "medium" as const : "low" as const,
      color: LANG_COLOR[l.language] ?? "#8b949e",
      improvementSuggestion: `Deepen ${l.language} expertise with real-world projects.`,
    }));
    // Add DSA skill based on problems solved
    if (totalProblems > 0) {
      detectedSkills.push({
        name: "Data Structures & Algorithms", category: "Backend",
        score: Math.min(95, Math.round(20 + Math.log2(totalProblems + 1) * 12)),
        confidence: totalProblems > 200 ? "high" : totalProblems > 50 ? "medium" : "low",
        color: "#8b5cf6", improvementSuggestion: "Target harder problems — focus on DP and graph algorithms.",
      });
    }
  }

  if (detectedSkills.length === 0) {
    // Absolute fallback defaults
    detectedSkills = [
      { name: "JavaScript", category: "Frontend", score: 65, confidence: "medium", color: "#f1e05a", improvementSuggestion: "Build a complex React app from scratch" },
      { name: "Git", category: "Tools", score: 70, confidence: "medium", color: "#f34f29", improvementSuggestion: "Learn rebasing, cherry-picking and git workflows" },
      { name: "REST APIs", category: "Backend", score: 60, confidence: "medium", color: "#25d366", improvementSuggestion: "Design and document a full API with OpenAPI spec" },
    ];
  }

  // Replace existing skills
  await db.delete(skillsTable).where(eq(skillsTable.userId, userId));
  if (detectedSkills.length > 0) {
    await db.insert(skillsTable).values(detectedSkills.map(s => ({ ...s, userId })));
  }

  res.json(AnalyzeSkillsResponse.parse({
    status: "completed",
    message: github ? `AI analyzed ${detectedSkills.length} skills from your GitHub profile` : "Skills populated with defaults. Connect GitHub for AI-powered analysis.",
    skillsDetected: detectedSkills.length,
  }));
});

// GET /skills/categories
router.get("/skills/categories", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const skills = await db.select().from(skillsTable).where(eq(skillsTable.userId, req.dbUserId!));
  if (skills.length === 0) { res.json(GetSkillCategoriesResponse.parse([])); return; }

  const categoryMap = new Map<string, typeof skills>();
  for (const skill of skills) {
    if (!categoryMap.has(skill.category)) categoryMap.set(skill.category, []);
    categoryMap.get(skill.category)!.push(skill);
  }

  const categories = Array.from(categoryMap.entries()).map(([category, catSkills]) => ({
    category,
    score: Math.round(catSkills.reduce((a, s) => a + s.score, 0) / catSkills.length),
    skills: catSkills,
  }));

  res.json(GetSkillCategoriesResponse.parse(categories));
});

export default router;
