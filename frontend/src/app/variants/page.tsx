import Link from "next/link";
import { Download, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VariantCard } from "@/components/variant-card";
import { VariantCompareTable } from "@/components/variant-compare-table";
import { MOCK_BRIEF, MOCK_VARIANTS } from "@/lib/mock-data";
import { AUDIENCES, BUDGET_TIERS, GENRES, REGIONS } from "@/lib/constraint-taxonomy";

function labelFor(options: { code: string; label: string }[], code: string) {
  return options.find((o) => o.code === code)?.label ?? code;
}

export default function VariantsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Generated variants</h1>
            <p className="text-muted-foreground">
              {MOCK_VARIANTS.length} distinct directions for this brief. Every variant respects all
              8 constraint dimensions simultaneously (FR-02, FR-04).
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <RefreshCcw className="h-4 w-4" /> Regenerate
            </Button>
            <Link href="/create" className={buttonVariants({ variant: "secondary", className: "gap-2" })}>
              Edit brief
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
          {MOCK_BRIEF.genres.map((g) => <Badge key={g}>{labelFor(GENRES, g)}</Badge>)}
          <span className="text-muted-foreground">&middot;</span>
          <span>{labelFor(AUDIENCES, MOCK_BRIEF.audience)}</span>
          <span className="text-muted-foreground">&middot;</span>
          <span>{labelFor(BUDGET_TIERS, MOCK_BRIEF.budgetTier)}</span>
          <span className="text-muted-foreground">&middot;</span>
          <span>{labelFor(REGIONS, MOCK_BRIEF.region)}</span>
          <span className="text-muted-foreground">&middot;</span>
          <span>{MOCK_BRIEF.runtimeMinutes} min</span>
          <span className="text-muted-foreground">&middot;</span>
          <span>{MOCK_BRIEF.censorshipFramework.toUpperCase()} {MOCK_BRIEF.censorshipRating}</span>
        </div>
      </div>

      <Tabs defaultValue="cards">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Download className="h-4 w-4" /> Export all
          </Button>
        </div>
        <TabsContent value="cards" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {MOCK_VARIANTS.map((variant, i) => (
              <VariantCard key={variant.id} variant={variant} index={i} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="compare" className="mt-6">
          <VariantCompareTable variants={MOCK_VARIANTS} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
