"use client";

import { use } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Clapperboard, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportDialog } from "@/components/export-dialog";
import { RefinementPanel } from "@/components/refinement-panel";
import { useVariant } from "@/hooks/use-variants";

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
      <Card className="border-destructive/40">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Variant not found, or you don&apos;t have access to it.</p>
          <Link href="/dashboard" className={buttonVariants({ variant: "secondary" })}>Back to dashboard</Link>
        </CardContent>
      </Card>
    );
  }

  const projectId = variant.generationRun.brief.project.id;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/projects/${projectId}`}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-2 text-muted-foreground" })}
        >
          <ArrowLeft className="h-4 w-4" /> Back to project
        </Link>
        <ExportDialog variant={variant} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-xl leading-snug font-medium">{variant.logline}</CardTitle>
                <Badge variant="outline" className="shrink-0">{variant.productionComplexity} complexity</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clapperboard className="h-4 w-4" /> {variant.estimatedLocations} locations</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {variant.estimatedPrincipalCast} principal cast</span>
                <span>VFX: {variant.vfxLevelUsed}</span>
              </div>
              <Separator />
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold">Three-act outline</h3>
                <div className="flex flex-col gap-3 text-sm">
                  <div>
                    <span className="font-medium">Act I</span>
                    <p className="text-muted-foreground">{variant.threeActOutline.act1}</p>
                  </div>
                  <div>
                    <span className="font-medium">Act II</span>
                    <p className="text-muted-foreground">{variant.threeActOutline.act2}</p>
                  </div>
                  <div>
                    <span className="font-medium">Act III</span>
                    <p className="text-muted-foreground">{variant.threeActOutline.act3}</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Central conflict</h3>
                <p className="text-sm text-muted-foreground">{variant.centralConflict}</p>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Character archetypes</h3>
                <div className="flex flex-wrap gap-1.5">
                  {variant.characterArchetypes.map((a) => (
                    <Badge key={a} variant="secondary">{a}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <RefinementPanel variantId={variant.id} />
        </div>
      </div>
    </div>
  );
}
