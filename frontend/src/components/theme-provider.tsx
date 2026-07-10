"use client";

/**
 * Wraps next-themes so `.dark` gets toggled on <html> and every shadcn
 * component that reads next-themes (e.g. ui/sonner.tsx's toast theming)
 * has a provider to read from — previously a latent, unwired dependency.
 * Dark-first per the design system (design.md): premium tool references
 * (Linear, Raycast, Cursor) default to dark, light is the alternate.
 */

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
