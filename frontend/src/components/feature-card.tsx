/**
 * Icon + title + description in a bordered surface — the landing page's
 * feature grid unit. A `LucideIcon` component reference (not a rendered
 * element) so this owns the icon's sizing/container consistently rather
 * than trusting each call site to wrap it the same way.
 */

import type { LucideIcon } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <div className="mb-2 flex size-9 items-center justify-center rounded-lg border border-border bg-muted">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
