"use client";

/**
 * FR-05 — iterative refinement of a selected variant without restarting
 * generation. AC-04 requires the structural core to be preserved while
 * incorporating the user's direction, so the UI explicitly frames this as
 * "refine," not "regenerate" (a separate, already-present action).
 *
 * A refinement creates a *new* Variant row linked back to the parent
 * (Refinement model) rather than mutating in place, so history is
 * preserved — on success this navigates to that new variant.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRefineVariant } from "@/hooks/use-variants";

const QUICK_SUGGESTIONS = [
  "Darker tone",
  "Reduce VFX dependency",
  "Add a subplot",
  "Simplify the cast",
  "Raise the stakes in Act III",
];

export function RefinementPanel({ variantId }: { variantId: string }) {
  const router = useRouter();
  const [instruction, setInstruction] = useState("");
  const refine = useRefineVariant(variantId);

  function applySuggestion(suggestion: string) {
    setInstruction((prev) => (prev ? `${prev}; ${suggestion.toLowerCase()}` : suggestion));
  }

  function handleRefine() {
    if (!instruction.trim()) {
      toast.error("Describe what you'd like to change first.");
      return;
    }
    refine.mutate(instruction, {
      onSuccess: (result) => {
        toast.success("Refinement applied", {
          description: "Structural core preserved per AC-04 — opening the refined version.",
        });
        router.push(`/variants/${result.id}`);
      },
      onError: () => {
        toast.error("Refinement failed. The AI service may be unavailable — try again.");
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="h-4 w-4" /> Refine this variant
        </CardTitle>
        <CardDescription>
          Targeted changes only — the logline, structure, and characters stay intact unless your
          instruction says otherwise.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_SUGGESTIONS.map((s) => (
            <Badge
              key={s}
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => applySuggestion(s)}
            >
              {s}
            </Badge>
          ))}
        </div>
        <Textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder='e.g. "darker tone, and give the mentor character a hidden motive"'
          rows={3}
        />
        {refine.isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <Button onClick={handleRefine} className="w-fit gap-2">
            <Wand2 className="h-4 w-4" /> Apply refinement
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
