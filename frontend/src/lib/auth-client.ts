/**
 * Client-side Better Auth bindings — `use client` components import
 * `authClient` (or the re-exported hooks) instead of hitting
 * /api/auth/* by hand. Mirrors the server config in lib/auth.ts but
 * carries no secrets; it's just a typed fetch wrapper.
 */

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { useSession, signIn, signUp, signOut } = authClient;
