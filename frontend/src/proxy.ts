/**
 * Auth-gates the app. Named `proxy.ts` per Next.js 16 (renamed from
 * `middleware.ts` — same mechanism, see next/dist/docs). Uses Better
 * Auth's `getSessionCookie` (cookie presence check only, no DB call)
 * rather than `auth.api.getSession` — proxy needs to stay fast and
 * doesn't need the full session object, just "is there a plausibly-valid
 * session." Route Handlers still call `requireSession()` (lib/session.ts)
 * for the real, DB-verified check — this is a UX redirect, not the actual
 * security boundary.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Exact-match, not prefix-match: "/" must not match via .startsWith(), or
// every path would count as public. "/login"/"/signup" are exact here too
// since neither has sub-routes today — if that changes, switch those two
// (not "/") to prefix matching deliberately.
const PUBLIC_PATHS = new Set(["/", "/login", "/signup"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
