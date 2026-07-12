"use client";

/**
 * NVIDIA/Groq generation-backend toggle (design.md Entry 19). Reads/writes
 * `lib/model-provider-store.ts` — every generation-triggering mutation
 * hook (useCreateProject, useCreateBrief, useRefineVariant) reads the
 * current value at call time, so flipping this changes which backend the
 * *next* generation uses, not anything already in flight or already
 * generated. Hidden when the sidebar is collapsed — a two-label toggle
 * doesn't fit meaningfully in icon-only width.
 */

import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import {
  getModelProvider,
  hydrateModelProviderFromStorage,
  setModelProvider,
  subscribeModelProvider,
  type ModelProviderName,
} from "@/lib/model-provider-store";

const OPTIONS: { value: ModelProviderName; label: string }[] = [
  { value: "nim", label: "NVIDIA" },
  { value: "groq", label: "Groq" },
];

export function ModelProviderToggle({ collapsed }: { collapsed?: boolean }) {
  const provider = useSyncExternalStore(subscribeModelProvider, getModelProvider, () => "nim");

  // Client-only hydration from localStorage, once — SSR/first paint always
  // render "nim" so there's nothing to mismatch (see store module doc).
  useEffect(() => {
    hydrateModelProviderFromStorage();
  }, []);

  if (collapsed) return null;

  return (
    <div className="flex flex-col gap-1.5 px-1">
      <span className="text-micro text-muted-foreground uppercase">Model</span>
      <div className="surface-muted flex rounded-md p-0.5" role="group" aria-label="Generation model">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setModelProvider(opt.value)}
            aria-pressed={provider === opt.value}
            className={cn(
              "flex-1 rounded-sm px-2 py-1 text-xs font-medium transition-colors duration-150",
              provider === opt.value
                ? "bg-background text-foreground shadow-elevation-1"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
