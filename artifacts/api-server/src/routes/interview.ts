import { Router, type IRouter } from "express";
import { db, codingProfilesTable, skillsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { GetInterviewReadinessResponse, GetCompanyReadinessResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /interview/readiness
router.get("/interview/readiness", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  const codingProfiles = await db.select().from(codingProfilesTable).where(eq(codingProfilesTable.userId, userId));
  const skills = await db.select().from(skillsTable).where(eq(skillsTable.userId, userId));

  const totalProblems = codingProfiles.reduce((a, p) => a + p.problemsSolved, 0);
  const avgSkillScore = skills.length > 0 ? skills.reduce((a, s) => a + s.score, 0) / skills.length : 50;
  const overallReadiness = Math.min(100, Math.round((totalProblems / 5 + avgSkillScore) / 2));

  res.json(GetInterviewReadinessResponse.parse({
    overallReadiness,
    roles: [
      { role: "SDE Intern", readiness: Math.min(100, overallReadiness + 20), missing: ["System Design basics", "OS fundamentals"] },
      { role: "SDE 1", readiness: overallReadiness, missing: ["LLD patterns", "Concurrency"] },
      { role: "Frontend Engineer", readiness: Math.min(100, Math.round(avgSkillScore * 0.9)), missing: ["Performance optimization", "Browser APIs"] },
      { role: "Backend Engineer", readiness: Math.min(100, Math.round(avgSkillScore * 0.85)), missing: ["Database design", "Caching strategies"] },
      { role: "Full Stack Engineer", readiness: Math.min(100, Math.round(avgSkillScore * 0.8)), missing: ["DevOps basics", "Cloud deployment"] },
      { role: "DevOps Engineer", readiness: Math.max(20, Math.round(avgSkillScore * 0.5)), missing: ["Kubernetes", "CI/CD pipelines", "Terraform"] },
      { role: "Data Engineer", readiness: Math.max(20, Math.round(avgSkillScore * 0.55)), missing: ["Spark/Hadoop", "Data modeling", "ETL pipelines"] },
      { role: "AI Engineer", readiness: Math.max(15, Math.round(avgSkillScore * 0.45)), missing: ["ML fundamentals", "PyTorch/TensorFlow", "Model deployment"] },
    ],
    strengths: ["Data Structures & Algorithms", "Frontend Development", "Version Control", "REST API Design"],
    weaknesses: ["System Design", "Cloud Architecture", "DevOps practices"],
    learningPlan: ["Complete 50 more medium LC problems", "Build a system design project", "Get AWS Cloud Practitioner certified"],
    expectedSalaryMin: 80000,
    expectedSalaryMax: 130000,
    recommendedProjects: ["Build a distributed cache", "Create a CI/CD pipeline", "Design a URL shortener"],
    recommendedCertifications: ["AWS Solutions Architect", "Google Cloud Professional", "Kubernetes Administrator"],
  }));
});

// GET /interview/company-readiness
router.get("/interview/company-readiness", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  const codingProfiles = await db.select().from(codingProfilesTable).where(eq(codingProfilesTable.userId, userId));
  const totalProblems = codingProfiles.reduce((a, p) => a + p.problemsSolved, 0);
  const base = Math.min(80, Math.round(totalProblems / 5));

  res.json(GetCompanyReadinessResponse.parse([
    { company: "Google", score: Math.max(15, base - 20), tier: "FAANG", missing: ["Advanced algorithms", "System design at scale", "Strong CS fundamentals"] },
    { company: "Amazon", score: Math.max(20, base - 10), tier: "FAANG", missing: ["Leadership principles", "Behavioral rounds", "Distributed systems"] },
    { company: "Microsoft", score: Math.max(25, base - 5), tier: "FAANG", missing: ["Azure services", "Design patterns", "Coding round prep"] },
    { company: "Stripe", score: Math.max(30, base + 5), tier: "Fintech Unicorn", missing: ["Distributed systems", "API design", "High concurrency"] },
    { company: "Uber", score: Math.max(35, base + 10), tier: "Tech Unicorn", missing: ["Geospatial algorithms", "System scale", "Concurrency"] },
    { company: "Airbnb", score: Math.max(40, base + 12), tier: "Tech Unicorn", missing: ["Search indexing", "Frontend polish"] },
    { company: "Coinbase", score: Math.max(40, base + 15), tier: "Crypto Fintech", missing: ["Web3 concepts", "Security standards"] },
    { company: "Atlassian", score: Math.max(30, base), tier: "Product Co.", missing: ["Collaboration tools", "Java/Kotlin stack"] },
  ]));
});

export default router;
