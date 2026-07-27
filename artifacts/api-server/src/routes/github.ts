import { Router, type IRouter } from "express";
import { db, usersTable, githubProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import {
  GetGithubProfileResponse,
  ConnectGithubBody,
  ConnectGithubResponse,
  GetGithubReposResponse,
  GetGithubLanguagesResponse,
  GetCommitActivityResponse,
} from "@workspace/api-zod";
import { rateLimit } from "../lib/rate-limit";

const router: IRouter = Router();

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Java: "#b07219", "C++": "#f34b7d", Go: "#00ADD8", Rust: "#dea584",
  Kotlin: "#A97BFF", Swift: "#F05138", Ruby: "#701516", PHP: "#4F5D95",
  "C#": "#178600", Dart: "#00B4AB", HTML: "#e34c26", CSS: "#563d7c",
  Shell: "#89e051", Vue: "#41b883", Svelte: "#ff3e00", Zig: "#ec915c",
};

import { clerkClient, getAuth } from "@clerk/express";

function ghHeaders(customToken?: string): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "SkillScope/1.0",
  };
  const token = customToken || process.env.GITHUB_TOKEN;
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

type GHError = { status: number; message: string };

async function ghFetch<T>(path: string, token?: string): Promise<{ data: T } | { error: GHError }> {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: ghHeaders(token),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) return { error: { status: 404, message: "Not found" } };
    if (res.status === 403 || res.status === 429) return { error: { status: 429, message: "GitHub API rate limit exceeded. Add a GITHUB_TOKEN secret for higher limits." } };
    if (!res.ok) return { error: { status: res.status, message: `GitHub API error ${res.status}` } };
    return { data: await res.json() as T };
  } catch (e) {
    return { error: { status: 503, message: e instanceof Error ? e.message : "Network error" } };
  }
}

interface GHUser {
  login: string; avatar_url: string; bio: string | null;
  public_repos: number; followers: number; following: number; name: string | null;
}
interface GHRepo {
  id: number; name: string; description: string | null; language: string | null;
  stargazers_count: number; forks_count: number; private: boolean;
  html_url: string; updated_at: string; fork: boolean;
}
interface GHEvent {
  type: string; created_at: string;
  payload?: { commits?: unknown[]; action?: string; pull_request?: unknown };
}

async function fetchGithubData(username: string, token?: string): Promise<
  | { data: ReturnType<typeof buildGithubPayload> }
  | { error: GHError }
> {
  const userResult = await ghFetch<GHUser>(`/users/${username}`, token);
  if ("error" in userResult) return { error: userResult.error };
  const user = userResult.data;

  const [reposResult, eventsResult] = await Promise.all([
    ghFetch<GHRepo[]>(`/users/${username}/repos?per_page=100&sort=updated`, token),
    ghFetch<GHEvent[]>(`/users/${username}/events?per_page=100`, token),
  ]);

  const repos: GHRepo[] = "data" in reposResult ? reposResult.data : [];
  const events: GHEvent[] = "data" in eventsResult ? eventsResult.data : [];
  const ownedRepos = repos.filter(r => !r.fork);

  // Aggregate language bytes
  const langBytes: Record<string, number> = {};
  const langResults = await Promise.all(
    ownedRepos.slice(0, 20).map(r => ghFetch<Record<string, number>>(`/repos/${username}/${r.name}/languages`, token))
  );
  for (const result of langResults) {
    if ("data" in result) {
      for (const [lang, bytes] of Object.entries(result.data)) {
        langBytes[lang] = (langBytes[lang] ?? 0) + bytes;
      }
    }
  }

  const totalBytes = Object.values(langBytes).reduce((a, b) => a + b, 0);
  const languageStats = totalBytes > 0
    ? Object.entries(langBytes)
      .map(([language, bytes]) => ({
        language,
        percentage: Math.round((bytes / totalBytes) * 1000) / 10,
        color: LANGUAGE_COLORS[language] ?? "#8b949e",
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8)
    : [];

  // Build commit activity from real push events (no synthetic data)
  const dailyCounts = new Map<string, number>();
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  for (const e of events) {
    if (e.type !== "PushEvent" || !e.created_at) continue;
    const ts = Date.parse(e.created_at);
    if (ts < now - oneYear) continue;
    const date = new Date(ts).toISOString().split("T")[0];
    const commits = Array.isArray(e.payload?.commits) ? e.payload!.commits!.length : 1;
    dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + commits);
  }

  // Weekly buckets (last 52 weeks) from real data
  const weeklyMap = new Map<string, number>();
  for (const [date, count] of dailyCounts) {
    const d = new Date(date);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const week = monday.toISOString().split("T")[0];
    weeklyMap.set(week, (weeklyMap.get(week) ?? 0) + count);
  }

  const commitActivity = Array.from({ length: 52 }, (_, i) => {
    const d = new Date(now - (51 - i) * 7 * 24 * 60 * 60 * 1000);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const week = monday.toISOString().split("T")[0];
    return { week, commits: weeklyMap.get(week) ?? 0 };
  });

  // Daily heatmap (real data only)
  const heatmapData = Array.from({ length: 365 }, (_, i) => {
    const d = new Date(now - (364 - i) * 86400000);
    const date = d.toISOString().split("T")[0];
    const count = dailyCounts.get(date) ?? 0;
    const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4;
    return { date, count, level };
  });

  const totalStars = ownedRepos.reduce((a, r) => a + r.stargazers_count, 0);
  const totalForks = ownedRepos.reduce((a, r) => a + r.forks_count, 0);
  const pushEvents = events.filter(e => e.type === "PushEvent");
  const totalCommits = pushEvents.reduce((a, e) => a + (Array.isArray(e.payload?.commits) ? e.payload!.commits!.length : 1), 0);
  const prEvents = events.filter(e => e.type === "PullRequestEvent");
  const topLanguage = languageStats[0]?.language ?? (ownedRepos.find(r => r.language)?.language ?? "Unknown");
  const weeklyHours = String(Math.min(40, Math.round((pushEvents.length / 4) * 10) / 10));

  const score = Math.min(100, Math.round(
    (Math.log2(totalStars + 1) * 5) +
    (Math.log2(totalCommits + 1) * 8) +
    (Math.log2(prEvents.length + 1) * 10) +
    (Math.log2(user.followers + 1) * 7) +
    (Math.min(ownedRepos.length, 30) * 1.5)
  ));

  const mappedRepos = ownedRepos.slice(0, 20).map(r => ({
    id: r.id, name: r.name,
    description: r.description ?? "",
    language: r.language ?? "Unknown",
    stars: r.stargazers_count, forks: r.forks_count,
    isPrivate: r.private, htmlUrl: r.html_url, updatedAt: r.updated_at,
  }));

  return { data: buildGithubPayload(username, user, { totalStars, totalForks, totalCommits, prEvents, topLanguage, weeklyHours, score, languageStats, commitActivity, heatmapData, mappedRepos, totalRepos: user.public_repos, followers: user.followers, following: user.following }) };
}

function buildGithubPayload(username: string, user: GHUser, d: {
  totalStars: number; totalForks: number; totalCommits: number; prEvents: GHEvent[];
  topLanguage: string; weeklyHours: string; score: number;
  languageStats: unknown[]; commitActivity: unknown[]; heatmapData: unknown[];
  mappedRepos: unknown[]; totalRepos: number; followers: number; following: number;
}) {
  return {
    username, avatarUrl: user.avatar_url, bio: user.bio, name: user.name,
    totalRepos: d.totalRepos, stars: d.totalStars, forks: d.totalForks,
    followers: d.followers, following: d.following,
    commits: d.totalCommits, pullRequests: d.prEvents.length,
    issues: 0, score: d.score, topLanguage: d.topLanguage,
    weeklyHours: d.weeklyHours,
    trendingRepo: "",
    languageStats: d.languageStats, commitActivity: d.commitActivity,
    heatmapData: d.heatmapData, repos: d.mappedRepos,
  };
}

// GET /github/profile
router.get("/github/profile", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const [profile] = await db.select().from(githubProfilesTable).where(eq(githubProfilesTable.userId, req.dbUserId!));
  if (!profile) { res.status(404).json({ error: "GitHub not connected" }); return; }
  res.json(GetGithubProfileResponse.parse({ ...profile, weeklyHours: profile.weeklyHours ? parseFloat(profile.weeklyHours) : null }));
});

// POST /github/connect  — rate limited to 10/hour per user
router.post("/github/connect", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  if (!rateLimit(`github:${userId}`, 10, 60 * 60 * 1000)) {
    res.status(429).json({ error: "Too many sync requests. Try again later." });
    return;
  }

  const parsed = ConnectGithubBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  // Fetch Clerk user OAuth token if they signed in via GitHub
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  let clerkToken: string | undefined;
  if (clerkUserId) {
    try {
      const tokens = await clerkClient.users.getUserOauthAccessToken(
        clerkUserId,
        "github"
      );
      clerkToken = tokens?.data?.[0]?.token;
    } catch (e) {
      console.error("Failed to retrieve Clerk user OAuth token:", e);
    }
  }

  const result = await fetchGithubData(parsed.data.username, clerkToken);
  if ("error" in result) {
    const status = result.error.status === 404 ? 404 : result.error.status === 429 ? 429 : 502;
    res.status(status).json({ error: result.error.message });
    return;
  }

  const payload = { userId, ...result.data };
  const [existing] = await db.select({ id: githubProfilesTable.id }).from(githubProfilesTable).where(eq(githubProfilesTable.userId, userId));
  let profile;
  if (existing) {
    [profile] = await db.update(githubProfilesTable).set(payload).where(eq(githubProfilesTable.userId, userId)).returning();
  } else {
    [profile] = await db.insert(githubProfilesTable).values(payload).returning();
  }
  await db.update(usersTable).set({ githubConnected: 1 }).where(eq(usersTable.id, userId));

  res.json(ConnectGithubResponse.parse({ ...profile, weeklyHours: profile.weeklyHours ? parseFloat(profile.weeklyHours) : null }));
});

// DELETE /github/profile
router.delete("/github/profile", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  await db.delete(githubProfilesTable).where(eq(githubProfilesTable.userId, userId));
  await db.update(usersTable).set({ githubConnected: 0 }).where(eq(usersTable.id, userId));
  res.status(204).end();
});

// GET /github/repos
router.get("/github/repos", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const [profile] = await db.select().from(githubProfilesTable).where(eq(githubProfilesTable.userId, req.dbUserId!));
  res.json(GetGithubReposResponse.parse((profile?.repos as unknown[]) ?? []));
});

// GET /github/languages
router.get("/github/languages", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const [profile] = await db.select().from(githubProfilesTable).where(eq(githubProfilesTable.userId, req.dbUserId!));
  res.json(GetGithubLanguagesResponse.parse((profile?.languageStats as unknown[]) ?? []));
});

// GET /github/commit-activity
router.get("/github/commit-activity", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const [profile] = await db.select().from(githubProfilesTable).where(eq(githubProfilesTable.userId, req.dbUserId!));
  res.json(GetCommitActivityResponse.parse((profile?.commitActivity as unknown[]) ?? []));
});

export default router;
