"use client";

import { use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, Loader2, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VariantCard } from "@/components/variant-card";
import { VariantCompareTable } from "@/components/variant-compare-table";
import { EmptyState } from "@/components/empty-state";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { useProject, useCreateBrief } from "@/hooks/use-projects";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: project, isLoading, isError } = useProject(id);
  const createBrief = useCreateBrief(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <EmptyState
        tone="destructive"
        icon={AlertTriangle}
        description="Project not found, or you don't have access to it."
        action={<Link href="/dashboard" className={buttonVariants({ variant: "secondary" })}>Back to dashboard</Link>}
      />
    );
  }

  const latestBrief = project.briefs[0];
  const latestRun = latestBrief?.generationRuns[0];

  function handleRegenerate() {
    if (!latestBrief) return;
    createBrief.mutate(
      {
        genres: latestBrief.genres,
        audience: latestBrief.audience,
        budgetTier: latestBrief.budgetTier,
        runtimeMinutes: latestBrief.runtimeMinutes,
        region: latestBrief.region,
        language: latestBrief.language,
        censorshipFramework: latestBrief.censorshipFramework,
        censorshipRating: latestBrief.censorshipRating,
        locationType: latestBrief.locationType,
        castSize: latestBrief.castSize,
        vfxDependency: latestBrief.vfxDependency,
        freeformNotes: latestBrief.freeformNotes,
      },
      {
        onSuccess: () => toast.success("New variants generated"),
        onError: () => toast.error("Regeneration failed. Try again."),
      }
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <FadeIn>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-h1 font-semibold tracking-tight">{project.title}</h1>
              {latestRun && (
                <p className="text-muted-foreground">
                  {latestRun.variants.length} distinct directions for this brief. Every variant respects all
                  8 constraint dimensions simultaneously (FR-02, FR-04).
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handleRegenerate} disabled={createBrief.isPending}>
                {createBrief.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Regenerate
              </Button>
              <Link href="/create" className={buttonVariants({ variant: "secondary", className: "gap-2" })}>
                New brief
              </Link>
            </div>
          </div>
          {latestBrief && (
            <div className="surface-muted flex flex-wrap items-center gap-2 rounded-lg p-3 text-sm">
              {latestBrief.genres.map((g) => <Badge key={g}>{g}</Badge>)}
              <span className="text-muted-foreground">&middot;</span>
              <span>{latestBrief.audience}</span>
              <span className="text-muted-foreground">&middot;</span>
              <span>{latestBrief.budgetTier}</span>
              <span className="text-muted-foreground">&middot;</span>
              <span>{latestBrief.region}</span>
              <span className="text-muted-foreground">&middot;</span>
              <span>{latestBrief.runtimeMinutes} min</span>
              <span className="text-muted-foreground">&middot;</span>
              <span>{latestBrief.censorshipFramework.toUpperCase()} {latestBrief.censorshipRating}</span>
            </div>
          )}
        </div>
      </FadeIn>

      {!latestRun && <EmptyState description="No generation run yet." />}

      {latestRun?.status === "generating" && (
        <EmptyState
          icon={Loader2}
          iconClassName="animate-spin"
          description="Generating variants — this can take a moment."
        />
      )}

      {latestRun?.status === "failed" && (
        <EmptyState
          tone="destructive"
          icon={AlertTriangle}
          description={`Generation failed${latestRun.errorMessage ? `: ${latestRun.errorMessage}` : "."}`}
          action={
            <Button onClick={handleRegenerate} disabled={createBrief.isPending} className="gap-2">
              {createBrief.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Try again
            </Button>
          }
        />
      )}

      {latestRun?.status === "complete" && latestRun.variants.length > 0 && (
        <Tabs defaultValue="cards">
          <TabsList>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
          </TabsList>
          <TabsContent value="cards" className="mt-6">
            <StaggerContainer className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {latestRun.variants
                .sort((a, b) => a.index - b.index)
                .map((variant, i) => (
                  <StaggerItem key={variant.id}>
                    <VariantCard variant={variant} index={i} />
                  </StaggerItem>
                ))}
            </StaggerContainer>
          </TabsContent>
          <TabsContent value="compare" className="mt-6">
            <VariantCompareTable variants={latestRun.variants.sort((a, b) => a.index - b.index)} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
