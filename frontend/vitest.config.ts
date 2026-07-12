import { defineConfig } from "vitest/config";

// Pure-logic unit tests only (lib/, no React components/DOM) for this first
// round — see design.md's Pending Tasks. `resolve.tsconfigPaths` resolves
// the `@/` alias the same way Next.js does, so test files can import
// exactly like application code does, no separate alias config to keep in
// sync (native Vite 6+ option — no plugin needed).
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
