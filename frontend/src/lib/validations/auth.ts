/**
 * Zod schemas for auth forms — the single source of truth for validation
 * rules, consumed by React Hook Form's resolver on the client. Kept
 * separate from route handlers since Better Auth validates signup/signin
 * itself server-side; these are for immediate client-side feedback only.
 */

import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type SignUpValues = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
export type SignInValues = z.infer<typeof signInSchema>;
