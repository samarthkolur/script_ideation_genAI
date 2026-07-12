/**
 * Minimal external store for the command palette's open/closed state — a
 * tiny pub/sub instead of React Context, since the only two consumers
 * (the palette dialog itself, and its sidebar trigger button in
 * app-shell.tsx) don't otherwise share a provider tree, and adding one
 * just for this would be more machinery than the problem needs.
 */

type Listener = (open: boolean) => void;

let isOpen = false;
const listeners = new Set<Listener>();

export function getCommandPaletteOpen() {
  return isOpen;
}

export function setCommandPaletteOpen(next: boolean) {
  isOpen = next;
  listeners.forEach((listener) => listener(isOpen));
}

export function toggleCommandPalette() {
  setCommandPaletteOpen(!isOpen);
}

export function subscribeCommandPalette(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
