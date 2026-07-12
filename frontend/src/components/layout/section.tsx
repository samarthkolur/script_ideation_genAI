/**
 * The one vertical-rhythm value used between major page sections (DD-024).
 * `spacious` is for marketing sections (landing page); default is tighter,
 * for in-app screens where content density matters more than breathing room.
 */

import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  spacious = false,
  ...props
}: React.ComponentProps<"section"> & { spacious?: boolean }) {
  return (
    <section className={cn(spacious ? "py-16 md:py-24" : "py-10", className)} {...props}>
      {children}
    </section>
  );
}
