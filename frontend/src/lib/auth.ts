/**
 * Better Auth server configuration — the only place session/credential
 * logic lives. Mounted at /api/auth/[...all] (see that route file) and
 * read from server code via `auth.api.getSession(...)`.
 *
 * v1 scope: email + password only (see design.md DD-008). Social providers
 * can be added additively later (Better Auth supports this without a
 * schema change) — not wired now because it needs OAuth app registration
 * the user hasn't set up.
 */

import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";

/**
 * Every user gets a personal Organization on signup — the schema supports
 * real multi-member orgs (OrganizationMember) from day one (design.md
 * DD-007), but team invites are a future feature. Doing this as a
 * databaseHook (not a step in the signup page) means it's guaranteed to
 * run for every signup path (email/password now, OAuth later) with no
 * chance of a page forgetting to call it.
 */
async function provisionPersonalOrganization(user: { id: string; name: string; email: string }) {
  const base = (user.name || user.email.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "workspace";
  let slug = base;
  let suffix = 1;
  while (await db.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${++suffix}`;
  }

  const organization = await db.organization.create({
    data: { name: `${user.name || user.email}'s Workspace`, slug },
  });
  await db.organizationMember.create({
    data: { organizationId: organization.id, userId: user.id, role: "owner" },
  });
}

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await provisionPersonalOrganization(user);
        },
      },
    },
  },
  plugins: [nextCookies()], // must be last — sets auth cookies on Server Actions/Route Handlers
});
