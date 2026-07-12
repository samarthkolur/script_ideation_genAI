"use client";

/**
 * Public marketing landing page. Rebuilt under the monochrome design
 * system (DD-024) — flat bordered surfaces, no gradients/glow/particles/
 * cursor effects. Composition still avoids a boring centered stack (hero,
 * a static product preview, a "how it works" illustration, a feature grid,
 * real-taxonomy proof, stats, CTA) but every visual choice is now
 * typography/spacing/contrast, not decoration.
 *
 * Functionally unchanged: session-aware CTA copy/destinations
 * (`useSession()`), same `/login` `/signup` `/dashboard` targets, same
 * chrome-less rendering via CHROME_LESS_PATHS in app-shell.tsx.
 */

import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Clapperboard,
  Gauge,
  Globe2,
  Languages,
  Shuffle,
  Sparkles,
  Wand2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/section-header";
import { FeatureCard } from "@/components/feature-card";
import { StatsCard } from "@/components/stats-card";
import { GenerationFlow } from "@/components/landing/generation-flow";
import { useSession } from "@/lib/auth-client";

const GENRES = [
  "Drama", "Comedy", "Thriller", "Horror", "Action", "Romance",
  "Science Fiction", "Fantasy", "Crime / Mystery", "Coming-of-Age",
  "Historical", "War", "Satire", "Musical",
];

const FRAMEWORKS = ["MPAA · USA", "BBFC · UK", "CBFC · India", "FSK · Germany", "CNC · France", "Eirin · Japan", "KMRB · South Korea", "NFVCB · Nigeria"];

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
    description: "3 to 6 genuinely different plot variants per brief, each with its own logline and central conflict.",
  },
  {
    icon: Globe2,
    title: "Built for global production",
    description: "Region-aware censorship frameworks and multilingual output, not a one-market tool.",
  },
  {
    icon: Wand2,
    title: "Targeted refinement",
    description:
      '"Darker tone." "Reduce VFX dependency." Refine a variant without losing its structural core or starting over.',
  },
];

const STATS = [
  { icon: Boxes, value: 8, suffix: "", label: "Constraint dimensions, validated at once" },
  { icon: Gauge, value: 70, suffix: "+", label: "Constraint values encoded" },
  { icon: Languages, value: 11, suffix: "", label: "Output languages" },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const primaryHref = session?.user ? "/dashboard" : "/signup";
  const primaryLabel = session?.user ? "Go to dashboard" : "Start a new brief";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <Container className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2.5 font-semibold tracking-tight">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Clapperboard className="h-3.5 w-3.5" aria-hidden />
            </div>
            <span>Script Ideation Assistant</span>
            <Badge variant="outline" className="ml-1">PS241</Badge>
          </div>
          <nav className="flex items-center gap-2">
            {session?.user ? (
              <Link href="/dashboard" className={buttonVariants({ size: "sm", className: "gap-2" })}>
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Sign in</Link>
                <Link href="/signup" className={buttonVariants({ size: "sm" })}>Get started</Link>
              </>
            )}
          </nav>
        </Container>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {/* ---------- HERO ---------- */}
        <Section spacious>
          <Container className="flex flex-col items-center gap-6 text-center">
            <FadeIn>
              <Badge variant="outline" className="gap-1.5 py-1">
                <span className="size-1.5 rounded-full bg-foreground" /> AI-native ideation engine
              </Badge>
            </FadeIn>
            <FadeIn delay={0.05}>
              <h1 className="text-hero max-w-3xl text-balance">
                One brief becomes a slate of directions.
              </h1>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="max-w-xl text-lg text-muted-foreground text-balance">
                Define genre, audience, budget, region, language, and censorship constraints once.
                Get logically consistent plot variants that respect every one of them at the same time.
              </p>
            </FadeIn>
            <FadeIn delay={0.15} className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href={primaryHref} className={buttonVariants({ size: "lg", className: "gap-2" })}>
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how-it-works" className={buttonVariants({ variant: "outline", size: "lg" })}>
                See how it works
              </a>
            </FadeIn>
          </Container>

          <Container className="mt-16">
            <FadeIn delay={0.2} viewport>
              <div className="surface overflow-hidden rounded-xl">
                <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
                  <span className="size-2.5 rounded-full bg-muted" />
                  <span className="size-2.5 rounded-full bg-muted" />
                  <span className="size-2.5 rounded-full bg-muted" />
                </div>
                <div className="grid gap-px bg-border sm:grid-cols-3">
                  {[
                    { label: "Variant 1", tag: "Low complexity", note: "A hacker uncovers a neural-implant conspiracy in Mumbai's underground clinics." },
                    { label: "Variant 2", tag: "Medium complexity", note: "A surgeon smuggles black-market implants to save her clinic — and gets caught between two cartels." },
                    { label: "Variant 3", tag: "Low complexity", note: "A journalist's memories are hijacked mid-investigation by the very implant she's exposing." },
                  ].map((v) => (
                    <div key={v.label} className="flex flex-col gap-2 bg-background p-5 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-micro text-muted-foreground">{v.label}</span>
                        <Badge variant="outline">{v.tag}</Badge>
                      </div>
                      <p className="text-sm text-foreground/90">{v.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </Container>
        </Section>

        {/* ---------- HOW IT WORKS ---------- */}
        <Section id="how-it-works" spacious>
          <Container className="flex flex-col gap-12">
            <SectionHeader kicker="How it works" title="From constraint to concept, in one pass." />
            <GenerationFlow />
          </Container>
        </Section>

        {/* ---------- FEATURES ---------- */}
        <Section spacious>
          <Container className="flex flex-col gap-10">
            <SectionHeader title="Built for the constraints real production actually has." />
            <StaggerContainer className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <StaggerItem key={feature.title}>
                  <FeatureCard icon={feature.icon} title={feature.title} description={feature.description} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </Container>
        </Section>

        {/* ---------- TAXONOMY PROOF (honest substitute for social proof) ---------- */}
        <Section spacious>
          <Container className="flex flex-col gap-6">
            <span className="text-micro text-muted-foreground uppercase">
              Every dimension is a real, enforced constraint — not a suggestion
            </span>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <span key={g} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground">{g}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {FRAMEWORKS.map((f) => (
                <span key={f} className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground">{f}</span>
              ))}
            </div>
          </Container>
        </Section>

        {/* ---------- STATS ---------- */}
        <Section spacious>
          <Container>
            <StaggerContainer className="grid gap-4 sm:grid-cols-3">
              {STATS.map((stat) => (
                <StaggerItem key={stat.label}>
                  <StatsCard icon={stat.icon} value={stat.value} suffix={stat.suffix} label={stat.label} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </Container>
        </Section>

        {/* ---------- FINAL CTA ---------- */}
        <Section spacious>
          <Container>
            <FadeIn viewport>
              <div className="surface flex flex-col items-center gap-6 rounded-xl px-8 py-16 text-center sm:px-16">
                <h2 className="text-h1 max-w-xl text-balance">
                  Your next brief is one form away from a full slate.
                </h2>
                <Link href={primaryHref} className={buttonVariants({ size: "lg", className: "gap-2" })}>
                  {primaryLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </FadeIn>
          </Container>
        </Section>
      </main>

      <footer className="border-t border-border py-6">
        <Container className="text-xs text-muted-foreground">
          PS241 — Script Ideation Assistant. AI-generated fiction — not based on real people or events.
        </Container>
      </footer>
    </div>
  );
}
