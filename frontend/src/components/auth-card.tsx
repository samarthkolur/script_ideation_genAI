/**
 * Shared chrome for /login and /signup — icon badge, title, description,
 * form content, footer link. The two pages were previously ~90% identical
 * markup with only the form fields differing; this pulls the shared shell
 * into one place so that duplication can't drift.
 */

import { Clapperboard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center gap-2 text-center">
        <div className="mb-1 flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
          <Clapperboard className="h-5 w-5" />
        </div>
        <CardTitle className="text-h3">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {children}
        {footer}
      </CardContent>
    </Card>
  );
}
