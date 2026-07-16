import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const githubProfilesTable = pgTable("github_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  totalRepos: integer("total_repos").notNull().default(0),
  stars: integer("stars").notNull().default(0),
  forks: integer("forks").notNull().default(0),
  followers: integer("followers").notNull().default(0),
  following: integer("following").notNull().default(0),
  commits: integer("commits").notNull().default(0),
  pullRequests: integer("pull_requests").notNull().default(0),
  issues: integer("issues").notNull().default(0),
  score: integer("score").notNull().default(0),
  topLanguage: text("top_language"),
  weeklyHours: text("weekly_hours"), // stored as string, parsed to number
  trendingRepo: text("trending_repo"),
  languageStats: jsonb("language_stats"), // LanguageStat[]
  commitActivity: jsonb("commit_activity"), // WeeklyActivity[]
  heatmapData: jsonb("heatmap_data"), // HeatmapDay[]
  repos: jsonb("repos"), // GithubRepo[]
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGithubProfileSchema = createInsertSchema(githubProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGithubProfile = z.infer<typeof insertGithubProfileSchema>;
export type GithubProfile = typeof githubProfilesTable.$inferSelect;
