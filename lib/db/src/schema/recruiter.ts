import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const bookmarkStatusEnum = pgEnum("bookmark_status", ["saved", "shortlisted", "contacted", "rejected"]);

export const recruiterBookmarksTable = pgTable("recruiter_bookmarks", {
  id: serial("id").primaryKey(),
  recruiterId: integer("recruiter_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  bookmarkedUserId: integer("bookmarked_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  notes: text("notes"),
  status: bookmarkStatusEnum("status").notNull().default("saved"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRecruiterBookmarkSchema = createInsertSchema(recruiterBookmarksTable).omit({ id: true, createdAt: true });
export type InsertRecruiterBookmark = z.infer<typeof insertRecruiterBookmarkSchema>;
export type RecruiterBookmark = typeof recruiterBookmarksTable.$inferSelect;
