"use client";

import Link from "next/link";
import { ArrowRight, FolderOpen, Layers, Sparkles, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { HeroSection } from "@/components/hero-section";
import { SectionHeader } from "@/components/section-header";
import { StatsCard } from "@/components/stats-card";
import { EmptyState } from "@/components/empty-state";
import { useProjects } from "@/hooks/use-projects";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const { data: projects, isLoading, isError } = useProjects();

  const totalRuns = projects?.reduce((sum, p) => sum + p.briefs.reduce((s, b) => s + b.generationRuns.length, 0), 0) ?? 0;
  const totalVariants =
    projects?.reduce(
      (sum, p) => sum + p.briefs.reduce((s, b) => s + b.generationRuns.reduce((r, run) => r + run.variants.length, 0), 0),
      0
    ) ?? 0;

  return (
    <div className="flex flex-col gap-12">
      <FadeIn>
        <HeroSection
          size="h1"
          kicker={
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" /> AI-powered ideation
            </Badge>
          }
          title="Turn one creative brief into a slate of production-ready plot directions."
          description="Define genre, audience, budget, region, language, and censorship constraints once — get 3 to 6 logically consistent variants that respect all of them simultaneously."
          actions={
            <Link href="/create" className={buttonVariants({ size: "lg", className: "gap-2" })}>
              Start a new brief <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </FadeIn>

      <FadeIn delay={0.08}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard icon={FolderOpen} value={projects?.length ?? 0} label="Projects" />
          <StatsCard icon={Zap} value={totalRuns} label="Generation runs" />
          <StatsCard icon={Layers} value={totalVariants} label="Variants generated" />
        </div>
      </FadeIn>

      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Your projects"
          action={projects && <span className="text-caption text-muted-foreground">{projects.length} total</span>}
        />

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="flex flex-col gap-3 py-6"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-full" /></CardContent></Card>
            ))}
          </div>
        )}

        {isError && (
          <EmptyState
            tone="destructive"
            description="Couldn't load your projects. Check the API/database connection and try again."
          />
        )}

        {projects && projects.length === 0 && (
          <EmptyState
            icon={FolderOpen}
            description="No projects yet — start your first brief to see it here."
            action={
              <Link href="/create" className={buttonVariants({ variant: "secondary", className: "mt-2 gap-2" })}>
                <Sparkles className="h-4 w-4" /> Start a new brief
              </Link>
            }
          />
        )}

        {projects && projects.length > 0 && (
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const latestBrief = project.briefs[0];
              const latestRun = latestBrief?.generationRuns[0];
              return (
                <StaggerItem key={project.id}>
                  <Link href={`/projects/${project.id}`}>
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="text-base leading-snug">{project.title}</CardTitle>
                        <CardDescription>{formatDate(project.createdAt)}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        {latestBrief && (
                          <div className="flex flex-wrap gap-1.5">
                            {latestBrief.genres.map((g) => (
                              <Badge key={g} variant="outline">{g}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {latestBrief && <span>{latestBrief.region}</span>}
                          {latestRun && (
                            <>
                              <span>&middot;</span>
                              <Badge
                                variant="outline"
                                className={
                                  latestRun.status === "complete"
                                    ? "border-success/30 text-success"
                                    : latestRun.status === "failed"
                                      ? "border-destructive/30 text-destructive"
                                      : "border-warning/30 text-warning"
                                }
                              >
                                {latestRun.status}
                              </Badge>
                              <span>&middot;</span>
                              <span>{latestRun.variants.length} variants</span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </section>
    </div>
  );
}
