"use client";

/**
 * Public marketing landing page — the actual public surface of the app.
 * Previously `/` was the authenticated dashboard itself, so an
 * unauthenticated visitor hit an immediate redirect to /login with
 * nothing public to see. Moved the dashboard to /dashboard; this page
 * doesn't use AppShell's authenticated nav (see CHROME_LESS_PATHS in
 * app-shell.tsx) — it has its own minimal header/footer, consistent with
 * how /login and /signup already work standalone.
 */

import Link from "next/link";
import {
  ArrowRight,
  Clapperboard,
  Globe2,
  Shuffle,
  Sparkles,
  Wand2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Constraint-aware generation",
    description:
      "Genre, audience, budget, runtime, region, language, censorship rating, and production limits — every variant respects all 8 simultaneously.",
  },
  {
    icon: Shuffle,
    title: "Distinct directions, not duplicates",
    description:
      "3 to 6 genuinely different plot variants per brief, each with its own logline, three-act outline, and central conflict.",
  },
  {
    icon: Wand2,
    title: "Targeted refinement",
    description:
      '"Darker tone." "Reduce VFX dependency." Refine a variant without losing its structural core or starting over.',
  },
  {
    icon: Globe2,
    title: "Built for global production",
    description:
      "Region-aware censorship frameworks (MPAA, BBFC, CBFC, and more) and multilingual output, not a one-market tool.",
  },
];

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <Clapperboard className="h-5 w-5 text-primary" aria-hidden />
            <span>Script Ideation Assistant</span>
            <span className="ml-2 rounded-full border px-2 py-0.5 text-xs font-normal text-muted-foreground">
              PS241
            </span>
          </div>
          <nav className="flex items-center gap-2">
            {session?.user ? (
              <Link href="/dashboard" className={buttonVariants({ size: "sm", className: "gap-2" })}>
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  Sign in
                </Link>
                <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-24">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" /> AI-powered ideation
          </Badge>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance">
            Turn one creative brief into a slate of production-ready plot directions.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground text-balance">
            Define genre, audience, budget, region, language, and censorship constraints once —
            get logically consistent variants that respect all of them simultaneously, in minutes
            instead of days.
          </p>
          <Link
            href={session?.user ? "/dashboard" : "/signup"}
            className={buttonVariants({ size: "lg", className: "mt-2 gap-2" })}
          >
            {session?.user ? "Go to dashboard" : "Start a new brief"} <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-4.5 w-4.5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="mx-auto max-w-6xl px-6 text-xs text-muted-foreground">
          PS241 — Script Ideation Assistant. AI-generated fiction — not based on real people or events.
        </div>
      </footer>
    </div>
  );
}
