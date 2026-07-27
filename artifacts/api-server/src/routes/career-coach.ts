import { Router, type IRouter } from "express";
import { db, chatMessagesTable, skillsTable, codingProfilesTable, githubProfilesTable, usersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import {
  GetCareerCoachMessagesResponse,
  SendCareerCoachMessageBody,
  SendCareerCoachMessageResponse,
} from "@workspace/api-zod";
import { openai } from "../lib/openai";
import { rateLimit } from "../lib/rate-limit";

const router: IRouter = Router();

function formatMsg(m: typeof chatMessagesTable.$inferSelect) {
  return { ...m, createdAt: m.createdAt.toISOString() };
}

const SYSTEM_PROMPT = `You are SkillScope's AI Career Coach — an expert advisor for software engineers and CS students, aiming for top product companies and global tech opportunities.

You have access to the user's real profile data (provided below). Use it to give hyper-personalized advice. Be direct, specific, and actionable.

Format responses with markdown (bold, bullet points, numbered lists). Keep responses under 400 words unless the user explicitly asks for more. Match the tone of a senior engineer who genuinely cares about helping.

Focus areas:
- DSA & competitive programming prep
- System design (HLD + LLD)
- Company-specific preparation (FAANG, tech unicorns, and top startups)
- Resume & LinkedIn optimization
- Open source contributions strategy
- Salary negotiation (local market context with USD conversion options)
- Placement / internship readiness for college students
- Career transitions and upskilling roadmaps`;

async function buildSystemContext(userId: number): Promise<string> {
  const [user, github] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, userId)).then(r => r[0]),
    db.select().from(githubProfilesTable).where(eq(githubProfilesTable.userId, userId)).then(r => r[0]),
  ]);
  const [codingProfiles, skills] = await Promise.all([
    db.select().from(codingProfilesTable).where(eq(codingProfilesTable.userId, userId)),
    db.select().from(skillsTable).where(eq(skillsTable.userId, userId)),
  ]);

  const totalProblems = codingProfiles.reduce((a, p) => a + p.problemsSolved, 0);
  const topSkills = [...skills].sort((a, b) => b.score - a.score).slice(0, 5).map(s => `${s.name} (${s.score}/100)`);

  const lines = [
    `User: ${user?.name ?? "Developer"} | Level ${user?.level ?? 1} | ${user?.xp ?? 0} XP`,
    user?.college ? `College: ${user.college}` : null,
    user?.location ? `Location: ${user.location}` : null,
    user?.graduationYear ? `Graduation: ${user.graduationYear}` : null,
    github ? `GitHub: @${github.username} | ${github.totalRepos} repos | ${github.stars} stars | ${github.commits} commits | ${github.followers} followers | Top lang: ${github.topLanguage}` : "GitHub: Not connected",
    codingProfiles.length > 0
      ? `Coding: ${codingProfiles.map(p => `${p.platform} (${p.problemsSolved} solved, rating: ${p.rating ?? "N/A"})`).join(", ")}`
      : "Coding platforms: None connected",
    `Total problems solved: ${totalProblems}`,
    topSkills.length > 0 ? `Top skills: ${topSkills.join(", ")}` : "Skills: Not analyzed yet",
  ].filter((l): l is string => l !== null);

  return `\n\n--- USER PROFILE ---\n${lines.join("\n")}\n--- END PROFILE ---`;
}

// GET /career-coach/messages
router.get("/career-coach/messages", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const messages = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, req.dbUserId!))
    .orderBy(asc(chatMessagesTable.createdAt));
  res.json(GetCareerCoachMessagesResponse.parse(messages.map(formatMsg)));
});

// POST /career-coach/messages  — rate limited to 30/hour per user
router.post("/career-coach/messages", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.dbUserId!;

  if (!rateLimit(`coach:${userId}`, 30, 60 * 60 * 1000)) {
    res.status(429).json({ error: "Message limit reached. Try again in an hour." });
    return;
  }

  const parsed = SendCareerCoachMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  // Save user message first
  await db.insert(chatMessagesTable).values({ userId, role: "user", content: parsed.data.content });

  // Build context + history
  const [history, profileContext] = await Promise.all([
    db.select().from(chatMessagesTable).where(eq(chatMessagesTable.userId, userId))
      .orderBy(asc(chatMessagesTable.createdAt)).limit(20),
    buildSystemContext(userId),
  ]);

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT + profileContext },
    ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  let aiContent: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 600,
      temperature: 0.7,
    }, { signal: controller.signal as AbortSignal });
    clearTimeout(timeout);
    aiContent = completion.choices[0]?.message?.content ?? "I couldn't generate a response. Please try again.";
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    aiContent = `I'm having trouble connecting right now (${msg}). Please try again in a moment.`;
  }

  const [aiMessage] = await db.insert(chatMessagesTable)
    .values({ userId, role: "assistant", content: aiContent })
    .returning();
  res.json(SendCareerCoachMessageResponse.parse(formatMsg(aiMessage)));
});

// DELETE /career-coach/messages/clear
router.delete("/career-coach/messages/clear", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.userId, req.dbUserId!));
  res.sendStatus(204);
});

export default router;
