"use client";

/**
 * Flat, edge-to-edge sidebar shell (DD-024) — replaces the earlier floating
 * glass-panel treatment with a plain bordered sidebar flush to the viewport
 * edge, the way Linear/Vercel's actual app chrome works (not an inset
 * "floating" card). Same auth/chrome-less logic as before (public landing +
 * auth pages render without this chrome), same nav destinations and
 * sign-out behavior — this is a layout/visual change, not a functionality
 * change.
 *
 * Desktop: a persistent, collapsible aside. Collapse toggles between
 * icon-only and labeled via a width transition — kept as motion because
 * it's a functional state change (this vs. that layout), not decoration.
 * Mobile: the same nav content inside a Sheet, triggered by a menu button
 * — no separate mobile-only nav to keep in sync.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import {
  Clapperboard,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { CommandPalette, CommandPaletteTrigger } from "@/components/command-palette";
import { useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create", label: "New Brief", icon: Sparkles },
];

// Exact match — see proxy.ts's identical concern: "/" must not become a
// prefix match, or every route would be treated as chrome-less.
const CHROME_LESS_PATHS = new Set(["/", "/login", "/signup"]);

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {active && (
              <motion.span
                layoutId="sidebar-active-indicator"
                className="absolute inset-0 rounded-md bg-accent"
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
            <link.icon className="relative z-10 h-4 w-4 shrink-0" />
            <span className={cn("relative z-10 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200", collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100")}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-1 font-semibold tracking-tight">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Clapperboard className="h-4 w-4" aria-hidden />
      </div>
      <span className={cn("overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200", collapsed ? "max-w-0 opacity-0" : "max-w-48 opacity-100")}>
        Script Ideation
      </span>
    </Link>
  );
}

function SidebarFooter({ collapsed, onSignOut }: { collapsed: boolean; onSignOut: () => void }) {
  const { data: session } = useSession();
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <div className={cn("flex items-center gap-2 px-1", collapsed && "justify-center")}>
        <ThemeToggle />
        {!collapsed && session?.user && (
          <span className="flex-1 truncate text-micro text-muted-foreground">{session.user.email}</span>
        )}
        {session?.user && (
          <Button variant="ghost" size="icon-sm" aria-label="Sign out" onClick={onSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (CHROME_LESS_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <CommandPalette />

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 232 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-30 hidden h-screen shrink-0 flex-col justify-between border-r border-border bg-sidebar p-3 md:flex"
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <SidebarBrand collapsed={collapsed} />
          </div>
          <CommandPaletteTrigger collapsed={collapsed} />
          <NavLinks collapsed={collapsed} />
        </div>
        <div className="flex flex-col gap-2">
          <SidebarFooter collapsed={collapsed} onSignOut={handleSignOut} />
          <Button
            variant="ghost"
            size="icon-sm"
            className="self-end"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </motion.aside>

      {/* Mobile top bar + sheet-based nav */}
      <div className="fixed top-0 right-0 left-0 z-30 flex items-center justify-between border-b border-border bg-background/95 p-3 md:hidden">
        <div className="flex items-center gap-2 px-1">
          <Clapperboard className="h-4 w-4" aria-hidden />
          <span className="text-sm font-semibold">Script Ideation</span>
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <SheetContent side="left" className="flex flex-col justify-between p-4">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex flex-col gap-6">
              <SidebarBrand collapsed={false} />
              <CommandPaletteTrigger />
              <NavLinks collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
            <SidebarFooter collapsed={false} onSignOut={handleSignOut} />
          </SheetContent>
        </Sheet>
      </div>

      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-6 py-10 pt-24 md:pt-10 outline-none">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
