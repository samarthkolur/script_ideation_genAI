"use client";

/**
 * Persistent top navigation shell, shared across every authenticated app
 * screen. Client component because it needs the live session for the
 * account menu / sign out. The public landing page (/) and auth pages
 * (/login, /signup) render without this chrome — they have their own
 * minimal headers — since there's no authenticated nav to show there.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clapperboard, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/create", label: "New Brief" },
];

// Exact match — see proxy.ts's identical concern: "/" must not become a
// prefix match, or every route would be treated as chrome-less.
const CHROME_LESS_PATHS = new Set(["/", "/login", "/signup"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  if (CHROME_LESS_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
            <Clapperboard className="h-5 w-5 text-primary" aria-hidden />
            <span>Script Ideation Assistant</span>
            <span className="ml-2 rounded-full border px-2 py-0.5 text-xs font-normal text-muted-foreground">
              PS241
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {link.label}
              </Link>
            ))}
            <ThemeToggle />
            {session?.user && (
              <Button variant="ghost" size="icon" aria-label="Sign out" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
      <footer className="border-t py-6">
        <div className="mx-auto max-w-6xl px-6 text-xs text-muted-foreground">
          PS241 — Script Ideation Assistant. AI-generated fiction — not based on real people or events.
        </div>
      </footer>
    </div>
  );
}
