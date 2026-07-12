/**
 * Icon + message + optional action, centered in a bordered surface —
 * replaces the hand-rolled empty/error-state card markup that was
 * previously duplicated across the dashboard's empty project list, the
 * project/variant "not found" states, and the constraint-taxonomy load
 * failure. `tone="destructive"` is for genuine error states (load
 * failures), the default tone is for "nothing here yet."
 */

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  iconClassName,
  title,
  description,
  action,
  tone = "default",
  className,
}: {
  icon?: LucideIcon;
  iconClassName?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  tone?: "default" | "destructive";
  className?: string;
}) {
  return (
    <Card className={cn(tone === "destructive" && "border-destructive/30", className)}>
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        {Icon && (
          <Icon
            className={cn("h-8 w-8", tone === "destructive" ? "text-destructive" : "text-muted-foreground", iconClassName)}
          />
        )}
        {title && <p className="text-h3">{title}</p>}
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
        {action}
      </CardContent>
    </Card>
  );
}
