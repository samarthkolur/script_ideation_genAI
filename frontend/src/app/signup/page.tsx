"use client";

/**
 * Minimal email/password signup (design.md DD-008: v1 auth scope). Full
 * marketing-shell/(auth) route-group layout is a sub-milestone 4 concern —
 * this page just needs to work end-to-end against Better Auth so the
 * Foundation sub-milestone is actually testable.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { AuthCard } from "@/components/auth-card";
import { FadeIn } from "@/components/motion/fade-in";
import { signUp } from "@/lib/auth-client";
import { signUpSchema, type SignUpValues } from "@/lib/validations/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) });

  async function onSubmit(values: SignUpValues) {
    setServerError(null);
    const { error } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    if (error) {
      setServerError(error.message ?? "Could not create your account. Try again.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <FadeIn className="w-full max-w-sm">
        <AuthCard
          title="Create your workspace"
          description="Script Ideation Assistant — PS241"
          footer={
            <p className="text-center text-caption text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <FormField label="Name" htmlFor="name" error={errors.name?.message}>
              <Input id="name" autoComplete="name" {...register("name")} />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
            </FormField>
            <FormField label="Password" htmlFor="password" error={errors.password?.message}>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            </FormField>
            {serverError && <p className="text-caption text-destructive">{serverError}</p>}
            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </AuthCard>
      </FadeIn>
    </div>
  );
}
