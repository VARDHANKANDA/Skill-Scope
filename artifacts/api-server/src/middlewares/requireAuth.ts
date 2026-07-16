import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthedRequest extends Request {
  dbUserId?: number;
  dbUserRole?: string;
}

export const requireAuth = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  if (!user) {
    res.status(401).json({ error: "User not found. Call /api/users/me/sync first." });
    return;
  }
  req.dbUserId = user.id;
  req.dbUserRole = user.role;
  next();
};

export const requireRecruiter = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  await requireAuth(req, res, () => {
    if (req.dbUserRole !== "recruiter" && req.dbUserRole !== "admin") {
      res.status(403).json({ error: "Recruiter role required" });
      return;
    }
    next();
  });
};
