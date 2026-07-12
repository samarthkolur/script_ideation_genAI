"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ApiProject, CreativeBrief } from "@/lib/types";

const PROJECTS_KEY = ["projects"] as const;
const projectKey = (id: string) => ["projects", id] as const;

export function useProjects() {
  return useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: () => apiFetch<ApiProject[]>("/api/projects"),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKey(id),
    queryFn: () => apiFetch<ApiProject>(`/api/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; brief: CreativeBrief }) =>
      apiFetch<ApiProject>("/api/projects", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useCreateBrief(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (brief: CreativeBrief) =>
      apiFetch(`/api/projects/${projectId}/briefs`, { method: "POST", body: JSON.stringify(brief) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKey(projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}
