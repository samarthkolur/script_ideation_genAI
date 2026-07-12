/**
 * Kicker + heading + optional description, with an optional right-aligned
 * action slot — the one pattern every "what is this section" moment on
 * every screen uses (landing sections, dashboard's project list, project
 * detail's header) instead of each screen hand-rolling its own heading
 * block with slightly different type/spacing choices.
 */

import { cn } from "@/lib/utils";

export function SectionHeader({
  kicker,
  title,
  description,
  action,
  className,
}: {
  kicker?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex max-w-xl flex-col gap-3">
        {kicker && <span className="text-micro text-muted-foreground uppercase">{kicker}</span>}
        <h2 className="text-h2 text-balance">{title}</h2>
        {description && <p className="text-body text-muted-foreground text-balance">{description}</p>}
      </div>
      {action}
    </div>
  );
}
