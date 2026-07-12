/**
 * Server-only helper every authenticated Route Handler calls first. Wraps
 * Better Auth's session lookup + the user's (currently: sole) organization
 * membership, since every product query is scoped by organizationId, not
 * userId directly (design.md DD-007/DD-008 — org-per-user now, real teams
 * later without a schema change).
 */

import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "UnauthorizedError";
  }
}

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new UnauthorizedError();

  const membership = await db.organizationMember.findFirst({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });
  if (!membership) throw new UnauthorizedError();

  return { user: session.user, organizationId: membership.organizationId };
}
