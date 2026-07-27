import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

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
  
  let user;
  try {
    const results = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkId));
    user = results[0];
  } catch (err: any) {
    logger.error({
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      schema: err.schema,
      table: err.table,
      column: err.column,
      constraint: err.constraint,
      stack: err.stack,
    }, "PostgreSQL Query Failure inside requireAuth middleware");
    throw err;
  }

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
