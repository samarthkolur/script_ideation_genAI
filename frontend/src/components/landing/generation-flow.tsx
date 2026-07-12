/**
 * "How it works" as a static illustration, not a demo — three bordered
 * nodes (Brief -> Constraint Engine -> Variants) connected by simple arrow
 * icons, so the product's actual mechanism (one brief, validated against
 * every constraint simultaneously, fans out into several distinct
 * variants) reads visually before anyone reads the copy. Flat and quiet by
 * design (DD-024) — no glow, no animated connector, no pulsing dot; the
 * previous version's traveling light-pulse was decoration, not signal, and
 * was removed under this system's "if it doesn't improve usability, remove
 * it" rule. Content is illustrative/representative, framed by the section
 * heading as "how it works," not a live functioning demo.
 */

import { ArrowRight, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";

const BRIEF_TAGS = ["Thriller", "Low-budget", "India · CBFC UA13"];
const VARIANTS = [
  { label: "Variant 1", complexity: "Low complexity" },
  { label: "Variant 2", complexity: "Medium complexity" },
  { label: "Variant 3", complexity: "Low complexity" },
];

export function GenerationFlow() {
  return (
    <StaggerContainer className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_auto_1fr_auto_1.3fr]">
      <StaggerItem>
        <div className="surface rounded-xl p-5">
          <div className="mb-3 flex items-center gap-2 text-micro text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Creative brief
          </div>
          <p className="mb-3 text-sm text-foreground/90">
            &ldquo;A neural-implant thriller, India, low budget.&rdquo;
          </p>
          <div className="flex flex-wrap gap-1.5">
            {BRIEF_TAGS.map((tag) => (
              <span key={tag} className="rounded-md border border-border bg-muted px-2.5 py-1 text-micro text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </StaggerItem>

      <ArrowRight className="mx-auto hidden h-4 w-4 shrink-0 text-muted-foreground lg:block" aria-hidden />

      <StaggerItem>
        <div className="surface flex flex-col items-center gap-2 rounded-xl p-5 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold">Constraint engine</span>
          <span className="text-micro text-muted-foreground">8 dimensions validated at once</span>
        </div>
      </StaggerItem>

      <ArrowRight className="mx-auto hidden h-4 w-4 shrink-0 text-muted-foreground lg:block" aria-hidden />

      <StaggerItem>
        <div className="flex flex-col gap-2.5">
          {VARIANTS.map((v) => (
            <div key={v.label} className="surface flex items-center justify-between rounded-lg px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" /> {v.label}
              </span>
              <span className="text-micro text-muted-foreground">{v.complexity}</span>
            </div>
          ))}
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
}
