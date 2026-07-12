/**
 * The one max-width/horizontal-padding pairing used across every screen —
 * "no random max-widths, no random paddings" (DD-024). Every section that
 * needs to align to the page's content column uses this instead of
 * hand-rolling `mx-auto max-w-6xl px-6` at each call site.
 */

import { cn } from "@/lib/utils";

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-6", className)}>{children}</div>;
}
