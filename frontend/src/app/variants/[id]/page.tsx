"use client";

import { use } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Clapperboard, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportDialog } from "@/components/export-dialog";
import { RefinementPanel } from "@/components/refinement-panel";
import { ScreenplayPanel } from "@/components/screenplay-panel";
import { EmptyState } from "@/components/empty-state";
import { FadeIn } from "@/components/motion/fade-in";
import { useVariant } from "@/hooks/use-variants";

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{heading}</h3>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export default function VariantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: variant, isLoading, isError } = useVariant(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-8 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !variant) {
    return (
      <EmptyState
        tone="destructive"
        icon={AlertTriangle}
        description="Variant not found, or you don't have access to it."
        action={<Link href="/dashboard" className={buttonVariants({ variant: "secondary" })}>Back to dashboard</Link>}
      />
    );
  }

  const projectId = variant.generationRun.brief.project.id;
  const { act1, act2, act3 } = variant.threeActStructure;

  return (
    <div className="flex flex-col gap-8">
      <FadeIn>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/projects/${projectId}`}
            className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-2 text-muted-foreground" })}
          >
            <ArrowLeft className="h-4 w-4" /> Back to project
          </Link>
          <ExportDialog variant={variant} />
        </div>
      </FadeIn>

      <div className="grid gap-8 lg:grid-cols-3">
        <FadeIn delay={0.08} className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-xl leading-snug font-medium">{variant.workingTitle}</CardTitle>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">{variant.genre}</Badge>
                    <Badge variant="secondary">{variant.tone}</Badge>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">{variant.productionComplexity} complexity</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <p className="text-base leading-snug">{variant.logline}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clapperboard className="h-4 w-4" /> {variant.estimatedLocations} locations</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {variant.estimatedPrincipalCast} principal cast</span>
                <span>VFX: {variant.vfxLevelUsed}</span>
              </div>
              <Separator />

              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="world">World &amp; Characters</TabsTrigger>
                  <TabsTrigger value="structure">Structure</TabsTrigger>
                  <TabsTrigger value="production">Production &amp; Constraints</TabsTrigger>
                  <TabsTrigger value="screenplay">Screenplay</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="flex flex-col gap-5 pt-4">
                  <Section heading="High concept">{variant.highConcept}</Section>
                  <Section heading="Theme">{variant.theme}</Section>
                  <Section heading="Emotional core">{variant.emotionalCore}</Section>
                  <Section heading="Central conflict">{variant.centralConflict}</Section>
                  <Section heading="Why this idea is unique">{variant.uniquenessNote}</Section>
                </TabsContent>

                <TabsContent value="world" className="flex flex-col gap-5 pt-4">
                  <Section heading="World building">{variant.worldBuilding}</Section>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold">Main characters</h3>
                    <div className="flex flex-col gap-3">
                      {variant.mainCharacters.map((c) => (
                        <Card key={c.name} className="surface-muted">
                          <CardContent className="flex flex-col gap-2 pt-4 text-sm">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-medium text-foreground">{c.name}</span>
                              <span className="text-xs text-muted-foreground">{c.age}</span>
                            </div>
                            <p><span className="font-medium text-foreground/80">Motivation — </span><span className="text-muted-foreground">{c.motivation}</span></p>
                            <p><span className="font-medium text-foreground/80">Internal conflict — </span><span className="text-muted-foreground">{c.internalConflict}</span></p>
                            <p><span className="font-medium text-foreground/80">External conflict — </span><span className="text-muted-foreground">{c.externalConflict}</span></p>
                            <p><span className="font-medium text-foreground/80">Arc — </span><span className="text-muted-foreground">{c.arc}</span></p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="structure" className="flex flex-col gap-5 pt-4">
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold">Act I</h3>
                    <p><span className="font-medium text-foreground/80">Opening image — </span><span className="text-muted-foreground">{act1.openingImage}</span></p>
                    <p><span className="font-medium text-foreground/80">Inciting incident — </span><span className="text-muted-foreground">{act1.incitingIncident}</span></p>
                    <p><span className="font-medium text-foreground/80">First turning point — </span><span className="text-muted-foreground">{act1.firstTurningPoint}</span></p>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold">Act II</h3>
                    <p><span className="font-medium text-foreground/80">Rising conflict — </span><span className="text-muted-foreground">{act2.risingConflict}</span></p>
                    <p><span className="font-medium text-foreground/80">Midpoint — </span><span className="text-muted-foreground">{act2.midpoint}</span></p>
                    <p><span className="font-medium text-foreground/80">Complications — </span><span className="text-muted-foreground">{act2.complications}</span></p>
                    <p><span className="font-medium text-foreground/80">Lowest point — </span><span className="text-muted-foreground">{act2.lowestPoint}</span></p>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold">Act III</h3>
                    <p><span className="font-medium text-foreground/80">Climax — </span><span className="text-muted-foreground">{act3.climax}</span></p>
                    <p><span className="font-medium text-foreground/80">Resolution — </span><span className="text-muted-foreground">{act3.resolution}</span></p>
                    <p><span className="font-medium text-foreground/80">Final image — </span><span className="text-muted-foreground">{act3.finalImage}</span></p>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold">Major plot twists</h3>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {variant.majorPlotTwists.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold">Character relationships</h3>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {variant.characterRelationships.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="production" className="flex flex-col gap-5 pt-4">
                  <Section heading="Visual style">{variant.visualStyle}</Section>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold">Cinematic references</h3>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {variant.cinematicReferences.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold">Production considerations</h3>
                    <p><span className="font-medium text-foreground/80">Locations — </span><span className="text-muted-foreground">{variant.productionConsiderations.locations}</span></p>
                    <p><span className="font-medium text-foreground/80">VFX — </span><span className="text-muted-foreground">{variant.productionConsiderations.vfx}</span></p>
                    <p><span className="font-medium text-foreground/80">Cast — </span><span className="text-muted-foreground">{variant.productionConsiderations.cast}</span></p>
                    <p><span className="font-medium text-foreground/80">Production scale — </span><span className="text-muted-foreground">{variant.productionConsiderations.productionScale}</span></p>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold">Constraint validation</h3>
                    <dl className="flex flex-col gap-2 text-sm">
                      {Object.entries(variant.constraintValidation).map(([dimension, explanation]) => (
                        <div key={dimension} className="flex flex-col gap-0.5">
                          <dt className="font-medium text-foreground/80 capitalize">{dimension.replaceAll("_", " ")}</dt>
                          <dd className="text-muted-foreground">{explanation}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </TabsContent>

                <TabsContent value="screenplay" className="pt-4">
                  <ScreenplayPanel variantId={variant.id} screenplayExcerpt={variant.screenplayExcerpt} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.16} className="flex flex-col gap-6">
          <RefinementPanel variantId={variant.id} />
        </FadeIn>
      </div>
    </div>
  );
}
