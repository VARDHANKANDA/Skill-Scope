import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const platformEnum = pgEnum("platform", ["leetcode", "codeforces", "codechef", "hackerrank", "geeksforgeeks", "atcoder", "hackerearth"]);

export const codingProfilesTable = pgTable("coding_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  username: text("username").notNull(),
  problemsSolved: integer("problems_solved").notNull().default(0),
  rating: integer("rating"),
  rank: text("rank"),
  streak: integer("streak"),
  easyCount: integer("easy_count"),
  mediumCount: integer("medium_count"),
  hardCount: integer("hard_count"),
  badges: integer("badges").notNull().default(0),
  lastSynced: timestamp("last_synced", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCodingProfileSchema = createInsertSchema(codingProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCodingProfile = z.infer<typeof insertCodingProfileSchema>;
export type CodingProfile = typeof codingProfilesTable.$inferSelect;
