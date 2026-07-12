"use client";

import Link from "next/link";
import { ArrowRight, FolderOpen, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const { data: projects, isLoading, isError } = useProjects();

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
          <h2 className="text-lg font-semibold tracking-tight">Your projects</h2>
          {projects && <span className="text-sm text-muted-foreground">{projects.length} total</span>}
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="flex flex-col gap-3 py-6"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-full" /></CardContent></Card>
            ))}
          </div>
        )}

        {isError && (
          <Card className="border-destructive/40">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Couldn&apos;t load your projects. Check the API/database connection and try again.
            </CardContent>
          </Card>
        )}

        {projects && projects.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No projects yet — start your first brief to see it here.</p>
              <Link href="/create" className={buttonVariants({ variant: "secondary", className: "mt-2 gap-2" })}>
                <Sparkles className="h-4 w-4" /> Start a new brief
              </Link>
            </CardContent>
          </Card>
        )}

        {projects && projects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const latestBrief = project.briefs[0];
              const latestRun = latestBrief?.generationRuns[0];
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/30">
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
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
