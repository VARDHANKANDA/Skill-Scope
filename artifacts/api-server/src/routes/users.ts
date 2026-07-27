import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { GetMeResponse, UpdateMeBody, SyncUserResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /users/me
router.get("/users/me", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.dbUserId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetMeResponse.parse({
    ...user,
    githubConnected: user.githubConnected === 1,
    createdAt: user.createdAt.toISOString(),
  }));
});

// PUT /users/me
router.put("/users/me", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, req.dbUserId!))
    .returning();
  res.json(GetMeResponse.parse({
    ...updated,
    githubConnected: updated.githubConnected === 1,
    createdAt: updated.createdAt.toISOString(),
  }));
});

import { clerkClient } from "@clerk/express";

import { logger } from "../lib/logger";

// POST /users/me/sync — JIT provisioning from Clerk session
router.post("/users/me/sync", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Fetch directly from Clerk API to ensure we always have the freshest avatar/profile data
  let email = `${clerkId}@placeholder.dev`;
  let name: string | null = null;
  let avatarUrl: string | null = null;
  let username: string | null = null;

  try {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    email = clerkUser.emailAddresses[0]?.emailAddress ?? email;
    name = clerkUser.fullName;
    avatarUrl = clerkUser.imageUrl;
    username = clerkUser.username;
  } catch (e) {
    console.error("Failed to fetch user from Clerk:", e);
    // Fallback to session claims if Clerk API call fails
    const claims = auth.sessionClaims as Record<string, unknown> | undefined;
    email = (claims?.email as string) || email;
    name = (claims?.name as string) || name;
    avatarUrl = (claims?.image_url as string) || avatarUrl;
    username = (claims?.username as string) || username;
  }

  let user: any = undefined;

  try {
    const results = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
    user = results[0];

    if (!user) {
      // Create new user — wrapped in transaction to avoid partial-failure races
      await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(usersTable)
          .values({ clerkId, email, name, avatarUrl, username })
          .returning();
        user = created;
      });
    } else {
      // Update mutable fields from Clerk
      const updates: Partial<typeof usersTable.$inferInsert> = {};
      if (email && email !== user.email) updates.email = email;
      if (name && name !== user.name) updates.name = name;
      if (avatarUrl && avatarUrl !== user.avatarUrl) updates.avatarUrl = avatarUrl;
      if (username && username !== user.username) updates.username = username;
      if (Object.keys(updates).length > 0) {
        const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.clerkId, clerkId)).returning();
        user = updated;
      }
    }
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
    }, "PostgreSQL Query Failure inside /users/me/sync");
    throw err;
  }

  if (!user) {
    res.status(500).json({ error: "Failed to sync user database profile" });
    return;
  }

  res.json(SyncUserResponse.parse({
    ...user,
    githubConnected: user.githubConnected === 1,
    createdAt: user.createdAt.toISOString(),
  }));
});

export default router;
