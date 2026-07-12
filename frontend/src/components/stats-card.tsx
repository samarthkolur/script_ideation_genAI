/**
 * Icon + animated count-up + label — used on the dashboard (project/run/
 * variant counts) and the landing page (constraint-system stats). One
 * definition instead of three near-identical inline blocks.
 */

import type { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { cn } from "@/lib/utils";

export function StatsCard({
  icon: Icon,
  value,
  suffix = "",
  label,
  className,
}: {
  icon?: LucideIcon;
  value: number;
  suffix?: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("surface flex flex-col items-start gap-3 rounded-xl p-6", className)}>
      {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      <div className="text-h1 tabular-nums">
        <AnimatedCounter value={value} />
        {suffix}
      </div>
      <p className="text-caption text-muted-foreground">{label}</p>
    </div>
  );
}
