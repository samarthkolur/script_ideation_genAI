/**
 * One generated plot variant, rendered per FR-03 (logline, three-act
 * outline, character archetypes, central conflict, production complexity).
 *
 * Kept presentational/server-renderable — no client state — so it can be
 * reused unchanged inside both the grid view (variants/page.tsx) and,
 * later, the detail/refinement view.
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
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Variant {index + 1}</span>
          <CardTitle className="text-base leading-snug font-medium">{variant.logline}</CardTitle>
        </div>
        <ComplexityIndicator complexity={variant.productionComplexity} />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2 text-sm">
          <p><span className="font-medium text-foreground/80">Act I — </span><span className="text-muted-foreground">{variant.threeActOutline.act1}</span></p>
          <p><span className="font-medium text-foreground/80">Act II — </span><span className="text-muted-foreground">{variant.threeActOutline.act2}</span></p>
          <p><span className="font-medium text-foreground/80">Act III — </span><span className="text-muted-foreground">{variant.threeActOutline.act3}</span></p>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Central conflict</span>
          <p className="text-sm">{variant.centralConflict}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {variant.characterArchetypes.map((archetype) => (
            <Badge key={archetype} variant="secondary">{archetype}</Badge>
          ))}
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
          Open &amp; refine <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}
