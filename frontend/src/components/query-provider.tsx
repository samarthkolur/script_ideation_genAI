"use client";

/**
 * TanStack Query provider for server-state (projects, variants, etc. once
 * the BFF API layer exists — sub-milestone 3). The QueryClient is created
 * inside useState, not at module scope, so each request on the server gets
 * its own instance instead of leaking cached data across users.
 */

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
