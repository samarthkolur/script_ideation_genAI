/**
 * FR-06 — side-by-side comparison of all variants across structural
 * dimensions. Separate component from VariantCard because the comparison
 * view intentionally trims content (no full three-act text) to keep every
 * variant visible without horizontal scrolling for the plan's target of
 * up to 6 variants (AC-03).
 */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ApiVariant } from "@/lib/types";

const ROWS: { label: string; render: (v: ApiVariant) => React.ReactNode }[] = [
  { label: "Logline", render: (v) => <span className="text-sm">{v.logline}</span> },
  { label: "Central conflict", render: (v) => <span className="text-sm text-muted-foreground">{v.centralConflict}</span> },
  {
    label: "Archetypes",
    render: (v) => (
      <div className="flex flex-wrap gap-1">
        {v.characterArchetypes.map((a) => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
      </div>
    ),
  },
  { label: "Complexity", render: (v) => <Badge variant="outline">{v.productionComplexity}</Badge> },
  { label: "Locations", render: (v) => <span>{v.estimatedLocations}</span> },
  { label: "Principal cast", render: (v) => <span>{v.estimatedPrincipalCast}</span> },
  { label: "VFX level", render: (v) => <span>{v.vfxLevelUsed}</span> },
];

export function VariantCompareTable({ variants }: { variants: ApiVariant[] }) {
  return (
    <div className="surface overflow-x-auto rounded-xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Dimension</TableHead>
            {variants.map((v, i) => (
              <TableHead key={v.id} className="min-w-64 align-top">Variant {i + 1}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="align-top font-medium text-muted-foreground">{row.label}</TableCell>
              {variants.map((v) => (
                <TableCell key={v.id} className="align-top">{row.render(v)}</TableCell>
              ))}
            </TableRow>
          ))}
          <TableRow>
            <TableCell />
            {variants.map((v) => (
              <TableCell key={v.id}>
                <Link href={`/variants/${v.id}`} className={buttonVariants({ size: "sm", variant: "secondary" })}>
                  Open &amp; refine
                </Link>
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
