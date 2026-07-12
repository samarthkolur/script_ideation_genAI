"use client";

/** Minimal email/password sign-in — see signup/page.tsx for the same notes. */

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { AuthCard } from "@/components/auth-card";
import { FadeIn } from "@/components/motion/fade-in";
import { signIn } from "@/lib/auth-client";
import { signInSchema, type SignInValues } from "@/lib/validations/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });

  async function onSubmit(values: SignInValues) {
    setServerError(null);
    const { error } = await signIn.email({ email: values.email, password: values.password });
    if (error) {
      setServerError(error.message ?? "Invalid email or password.");
      return;
    }
    router.push(searchParams.get("redirect") || "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
      </FormField>
      {serverError && <p className="text-caption text-destructive">{serverError}</p>}
      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <FadeIn className="w-full max-w-sm">
        <AuthCard
          title="Welcome back"
          description="Script Ideation Assistant — PS241"
          footer={
            <p className="text-center text-caption text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
                Create one
              </Link>
            </p>
          }
        >
          <Suspense fallback={<div className="h-40" />}>
            <LoginForm />
          </Suspense>
        </AuthCard>
      </FadeIn>
    </div>
  );
}
