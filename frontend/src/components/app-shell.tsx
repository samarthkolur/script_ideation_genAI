/**
 * Persistent top navigation shell, shared across every screen.
 *
 * Why this exists: FR-07 (session history) and the overall product need a
 * constant sense of place — which screen you're on, and a way back to the
 * dashboard — while each route's page.tsx stays focused on its own screen
 * content. Server component (no interactivity of its own) so it adds no
 * client JS beyond what Link/the icon already need.
 */

import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/create", label: "New Brief" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
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
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
      <footer className="border-t py-6">
        <div className="mx-auto max-w-6xl px-6 text-xs text-muted-foreground">
          Wireframe build — Phase 1, Milestone 1.3. Mock data only, no live generation.
        </div>
      </footer>
    </div>
  );
}
