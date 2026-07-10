import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_SESSIONS } from "@/lib/mock-data";
import { GENRES, REGIONS, BUDGET_TIERS } from "@/lib/constraint-taxonomy";

function labelFor(options: { code: string; label: string }[], code: string) {
  return options.find((o) => o.code === code)?.label ?? code;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-start gap-4 rounded-xl border bg-gradient-to-br from-primary/5 via-transparent to-transparent p-10">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> AI-powered ideation
        </Badge>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance">
          Turn one creative brief into a slate of production-ready plot directions.
        </h1>
        <p className="max-w-xl text-muted-foreground text-balance">
          Define genre, audience, budget, region, language, and censorship constraints once —
          get 3 to 6 logically consistent variants that respect all of them simultaneously.
        </p>
        <Link href="/create" className={buttonVariants({ size: "lg", className: "mt-2 gap-2" })}>
          Start a new brief <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recent sessions</h2>
          <span className="text-sm text-muted-foreground">{MOCK_SESSIONS.length} in this session context</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_SESSIONS.map((session) => (
            <Link key={session.id} href="/variants">
              <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/30">
                <CardHeader>
                  <CardTitle className="text-base leading-snug">{session.title}</CardTitle>
                  <CardDescription>{formatDate(session.createdAt)}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {session.brief.genres.map((g) => (
                      <Badge key={g} variant="outline">{labelFor(GENRES, g)}</Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{labelFor(REGIONS, session.brief.region)}</span>
                    <span>&middot;</span>
                    <span>{labelFor(BUDGET_TIERS, session.brief.budgetTier)}</span>
                    <span>&middot;</span>
                    <span>{session.variantCount} variants</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
