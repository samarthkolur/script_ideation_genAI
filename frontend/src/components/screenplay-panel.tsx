"use client";

/**
 * On-demand professional screenplay excerpt (design.md's screenplay-
 * ideation redesign) — separate from generation/refinement so the initial
 * "generate variants" step stays fast; this is only produced when a
 * writer explicitly asks for it on a chosen variant.
 */

import { motion } from "motion/react";
import { toast } from "sonner";
import { Clapperboard, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useGenerateScreenplay } from "@/hooks/use-variants";

export function ScreenplayPanel({
  variantId,
  screenplayExcerpt,
}: {
  variantId: string;
  screenplayExcerpt: string | null;
}) {
  const generate = useGenerateScreenplay(variantId);

  function handleGenerate() {
    generate.mutate(undefined, {
      onSuccess: () => toast.success("Screenplay excerpt generated"),
      onError: () => toast.error("Screenplay generation failed. The AI service may be unavailable — try again."),
    });
  }

  if (generate.isPending) {
    return (
      <div className="surface-muted flex items-center gap-3 rounded-lg px-4 py-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </motion.div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Writing screenplay excerpt…</span>
          <span className="text-xs text-muted-foreground">Formatting scenes, dialogue, and transitions</span>
        </div>
      </div>
    );
  }

  if (!screenplayExcerpt) {
    return (
      <div className="surface-muted flex flex-col items-center gap-3 rounded-lg px-6 py-10 text-center">
        <Clapperboard className="h-6 w-6 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">No screenplay excerpt yet</span>
          <span className="text-xs text-muted-foreground">
            Generate a formatted, industry-standard opening — slug lines, action, dialogue — for this variant.
          </span>
        </div>
        <Button onClick={handleGenerate} className="mt-2 gap-2">
          <Clapperboard className="h-4 w-4" /> Generate screenplay excerpt
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground">Formatted for Final Draft / Celtx / WriterDuet</span>
        <Button onClick={handleGenerate} variant="secondary" size="sm" className="gap-2">
          <Clapperboard className="h-3.5 w-3.5" /> Regenerate
        </Button>
      </div>
      <pre className="surface-muted overflow-x-auto rounded-lg p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap">
        {screenplayExcerpt}
      </pre>
    </div>
  );
}
