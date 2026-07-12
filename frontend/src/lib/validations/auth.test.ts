import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "./auth";

describe("signUpSchema", () => {
  it("accepts a valid signup", () => {
    const result = signUpSchema.safeParse({ name: "Ada", email: "ada@example.com", password: "longenough" });
    expect(result.success).toBe(true);
  });

  it("rejects a blank name", () => {
    const result = signUpSchema.safeParse({ name: "  ", email: "ada@example.com", password: "longenough" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({ name: "Ada", email: "not-an-email", password: "longenough" });
    expect(result.success).toBe(false);
  });

  it("rejects a password under 8 characters", () => {
    const result = signUpSchema.safeParse({ name: "Ada", email: "ada@example.com", password: "short" });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 8 characters (boundary)", () => {
    const result = signUpSchema.safeParse({ name: "Ada", email: "ada@example.com", password: "exactly8" });
    expect(result.success).toBe(true);
  });
});

describe("signInSchema", () => {
  it("accepts a non-empty password of any length (sign-in isn't where length is enforced)", () => {
    const result = signInSchema.safeParse({ email: "ada@example.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = signInSchema.safeParse({ email: "ada@example.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signInSchema.safeParse({ email: "nope", password: "x" });
    expect(result.success).toBe(false);
  });
});
