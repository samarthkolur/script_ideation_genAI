/**
 * The flagship headline block — used once on the landing page (`size="hero"`,
 * the 72px scale) and once on the dashboard (`size="h1"`, so an in-app
 * surface doesn't shout as loud as the marketing page). Kicker/description/
 * actions are all optional so the same component covers both without a
 * second near-identical one.
 */

import { cn } from "@/lib/utils";

export function HeroSection({
  kicker,
  title,
  description,
  actions,
  size = "hero",
  className,
}: {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  size?: "hero" | "h1";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-6", className)}>
      {kicker}
      <h1 className={cn(size === "hero" ? "text-hero max-w-2xl" : "text-h1 max-w-xl", "text-balance")}>{title}</h1>
      {description && <p className="max-w-lg text-lg text-muted-foreground text-balance">{description}</p>}
      {actions && <div className="flex flex-wrap items-center gap-3 pt-2">{actions}</div>}
    </div>
  );
}
