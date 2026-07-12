"use client";

/**
 * Global ⌘K / Ctrl+K command palette — jump to a project, start a new
 * brief, toggle theme, sign out. Mounted once in app-shell.tsx (only on
 * authenticated routes, alongside the rest of the app chrome); the
 * `CommandPaletteTrigger` button placed in the sidebar and this dialog
 * share open/closed state via `lib/command-palette-store.ts` rather than
 * needing a shared parent to lift state into.
 */

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LayoutDashboard, LogOut, Moon, SearchIcon, Sparkles, Sun } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/use-projects";
import { signOut } from "@/lib/auth-client";
import {
  getCommandPaletteOpen,
  setCommandPaletteOpen,
  subscribeCommandPalette,
  toggleCommandPalette,
} from "@/lib/command-palette-store";

export function CommandPalette() {
  const open = useSyncExternalStore(subscribeCommandPalette, getCommandPaletteOpen, () => false);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { data: projects } = useProjects();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleCommandPalette();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function runCommand(action: () => void) {
    setCommandPaletteOpen(false);
    action();
  }

  return (
    <CommandDialog open={open} onOpenChange={setCommandPaletteOpen}>
      <Command>
        <CommandInput placeholder="Search projects, jump to a page..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
              <LayoutDashboard /> Dashboard
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/create"))}>
              <Sparkles /> New brief
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          {projects && projects.length > 0 && (
            <CommandGroup heading="Projects">
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.title}
                  onSelect={() => runCommand(() => router.push(`/projects/${project.id}`))}
                >
                  <SearchIcon /> {project.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          <CommandSeparator />
          <CommandGroup heading="Preferences">
            <CommandItem
              onSelect={() => runCommand(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
            >
              {resolvedTheme === "dark" ? <Sun /> : <Moon />}
              {resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(async () => {
                  await signOut();
                  router.push("/login");
                  router.refresh();
                })
              }
            >
              <LogOut /> Sign out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

export function CommandPaletteTrigger({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Open command palette"
        onClick={() => setCommandPaletteOpen(true)}
        className="self-center"
      >
        <SearchIcon className="h-4 w-4" />
      </Button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setCommandPaletteOpen(true)}
      className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <SearchIcon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">Search</span>
      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-micro text-muted-foreground">⌘K</kbd>
    </button>
  );
}
