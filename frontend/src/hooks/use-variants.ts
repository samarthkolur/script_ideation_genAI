"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ApiVariant, ApiVariantDetail } from "@/lib/types";

export function useVariant(id: string) {
  return useQuery({
    queryKey: ["variants", id],
    queryFn: () => apiFetch<ApiVariantDetail>(`/api/variants/${id}`),
    enabled: !!id,
  });
}

export function useRefineVariant(variantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instruction: string) =>
      apiFetch<ApiVariant>(`/api/variants/${variantId}/refine`, {
        method: "POST",
        body: JSON.stringify({ instruction }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variants", variantId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

/** Triggers a browser download directly — export isn't persisted server-side (design.md: no blob storage yet), so this is a fetch + blob download, not a query. */
export async function exportVariant(variantId: string, format: "pdf" | "text") {
  const response = await fetch(`/api/variants/${variantId}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format }),
  });
  if (!response.ok) throw new Error("Export failed");
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filenameMatch = disposition.match(/filename="([^"]+)"/);
  const filename = filenameMatch?.[1] ?? `export.${format === "pdf" ? "pdf" : "txt"}`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
