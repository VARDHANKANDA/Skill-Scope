import { pgTable, text, serial, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const difficultyEnum = pgEnum("difficulty", ["beginner", "intermediate", "advanced", "expert"]);

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  language: text("language"),
  stars: integer("stars").notNull().default(0),
  difficulty: difficultyEnum("difficulty").notNull().default("intermediate"),
  score: integer("score").notNull().default(0),
  techStack: jsonb("tech_stack"), // string[]
  htmlUrl: text("html_url"),
  summary: text("summary"),
  architecture: text("architecture"),
  codeComplexity: integer("code_complexity").default(0),
  maintainabilityIndex: integer("maintainability_index").default(0),
  documentationScore: integer("documentation_score").default(0),
  readabilityScore: integer("readability_score").default(0),
  testingScore: integer("testing_score").default(0),
  securityScore: integer("security_score").default(0),
  performanceSuggestions: jsonb("performance_suggestions"), // string[]
  designPatterns: jsonb("design_patterns"), // string[]
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
