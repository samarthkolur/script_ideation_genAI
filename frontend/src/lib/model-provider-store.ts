/**
 * The sidebar's NVIDIA/Groq toggle (design.md Entry 19) — a small external
 * store, same pub/sub shape as `command-palette-store.ts`, so the toggle
 * button and every mutation hook that needs "which provider is currently
 * selected" don't need a shared React Context provider wired into
 * layout.tsx just for this. Persisted to localStorage so the choice
 * survives a reload; defaults to "nim" server-side and on first paint
 * (localStorage doesn't exist during SSR) — `hydrateModelProviderFromStorage()`
 * corrects it once on the client, mirroring next-themes' own hydration-safe
 * pattern (see theme-toggle.tsx's `mounted` guard) so this never causes a
 * hydration mismatch.
 */

export type ModelProviderName = "nim" | "groq";

const STORAGE_KEY = "script-ideation:model-provider";
const listeners = new Set<(value: ModelProviderName) => void>();
let current: ModelProviderName = "nim";

export function getModelProvider(): ModelProviderName {
  return current;
}

export function setModelProvider(next: ModelProviderName) {
  current = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next);
  }
  listeners.forEach((listener) => listener(current));
}

export function subscribeModelProvider(listener: (value: ModelProviderName) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Client-only, called once after mount — see module doc for why. */
export function hydrateModelProviderFromStorage() {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if ((stored === "nim" || stored === "groq") && stored !== current) {
    current = stored;
    listeners.forEach((listener) => listener(current));
  }
}
