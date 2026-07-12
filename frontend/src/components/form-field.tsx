/**
 * Label + control + error/description, consistently spaced — replaces the
 * hand-rolled `<div className="flex flex-col gap-1.5"><Label/>...<p/></div>`
 * block that was previously duplicated at every field in constraint-form,
 * login, and signup. Takes the control as `children` rather than rendering
 * its own input, since fields here are Input/Select/Textarea/RadioGroup/
 * Checkbox-based and react-hook-form's `register()` needs to spread
 * directly onto the actual control.
 *
 * Wires real a11y, not just visual error styling: every Input/Select/
 * Textarea already has `aria-invalid:*` Tailwind variants (see
 * components/ui/*), but nothing in the app was ever actually setting the
 * `aria-invalid` attribute or linking the error text to the control via
 * `aria-describedby` — a screen reader user got no signal a field was
 * invalid at all. Fixed here, once, via `cloneElement` on the single
 * control child, rather than at every call site.
 */

import { cloneElement, isValidElement, useId, type ReactElement } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function FormField({
  label,
  htmlFor,
  error,
  description,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  error?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;
  const messageId = error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined;

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ "aria-invalid"?: boolean; "aria-describedby"?: string }>, {
        "aria-invalid": !!error,
        ...(messageId ? { "aria-describedby": messageId } : {}),
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {control}
      {error ? (
        <p id={messageId} className="text-micro text-destructive">{error}</p>
      ) : description ? (
        <p id={messageId} className="text-micro text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
