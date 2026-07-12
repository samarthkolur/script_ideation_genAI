"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ConstraintTaxonomy } from "@/lib/types";

/** Replaces the Phase 1 hardcoded frontend/src/lib/constraint-taxonomy.ts — served from Postgres now (NFR-08). */
export function useConstraintTaxonomy() {
  return useQuery({
    queryKey: ["constraint-taxonomy"],
    queryFn: () => apiFetch<ConstraintTaxonomy>("/api/constraint-taxonomy"),
    staleTime: 5 * 60 * 1000, // taxonomy changes rarely; avoid refetching on every mount
  });
}
