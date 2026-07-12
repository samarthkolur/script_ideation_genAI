/**
 * One generated plot variant, rendered as a scannable summary card — the
 * full 18-section development document lives on the detail page
 * (app/variants/[id]/page.tsx), this stays a grid-friendly overview
 * (title, genre/tone, logline, high concept) per design.md's
 * screenplay-ideation redesign.
 *
 * Kept presentational/server-renderable — no client state — so it can be
 * reused unchanged inside both the grid view (projects/[id]/page.tsx) and
 * anywhere else a variant list is shown.
 */

import Link from "next/link";
import { ArrowRight, Clapperboard, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ApiVariant } from "@/lib/types";

// Monochrome tier indicator (DD-024) — complexity is conveyed by how many
// of three dots are filled, not by color, so it stays legible on the
// black-and-white palette while still scannable at a glance across a grid.
const COMPLEXITY_LEVEL: Record<ApiVariant["productionComplexity"], number> = { low: 1, medium: 2, high: 3 };

function ComplexityIndicator({ complexity }: { complexity: ApiVariant["productionComplexity"] }) {
  const level = COMPLEXITY_LEVEL[complexity];
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-micro text-muted-foreground">
      <span className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn("size-1.5 rounded-full", i <= level ? "bg-foreground" : "bg-border")} />
        ))}
      </span>
      {complexity}
    </span>
  );
}

export function VariantCard({ variant, index }: { variant: ApiVariant; index: number }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Variant {index + 1}</span>
          <ComplexityIndicator complexity={variant.productionComplexity} />
        </div>
        <CardTitle className="text-base leading-snug font-medium">{variant.workingTitle}</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{variant.genre}</Badge>
          <Badge variant="secondary">{variant.tone}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-sm text-muted-foreground">{variant.logline}</p>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">High concept</span>
          <p className="text-sm">{variant.highConcept}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Theme</span>
          <p className="text-sm text-muted-foreground">{variant.theme}</p>
        </div>
        <div className="mt-auto flex flex-wrap gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clapperboard className="h-3.5 w-3.5" /> {variant.estimatedLocations} locations</span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {variant.estimatedPrincipalCast} principal cast</span>
          <span>VFX: {variant.vfxLevelUsed}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link
          href={`/variants/${variant.id}`}
          className={buttonVariants({ variant: "secondary", className: "w-full gap-2" })}
        >
          Open full treatment <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}
