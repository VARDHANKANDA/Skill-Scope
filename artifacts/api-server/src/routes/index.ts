import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";
import githubRouter from "./github";
import codingRouter from "./coding";
import skillsRouter from "./skills";
import projectsRouter from "./projects";
import resumesRouter from "./resumes";
import interviewRouter from "./interview";
import careerCoachRouter from "./career-coach";
import roadmapRouter from "./roadmap";
import gamificationRouter from "./gamification";
import recruiterRouter from "./recruiter";
import publicRouter from "./public";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(dashboardRouter);
router.use(githubRouter);
router.use(codingRouter);
router.use(skillsRouter);
router.use(projectsRouter);
router.use(resumesRouter);
router.use(interviewRouter);
router.use(careerCoachRouter);
router.use(roadmapRouter);
router.use(gamificationRouter);
router.use(recruiterRouter);
router.use(publicRouter);

export default router;
