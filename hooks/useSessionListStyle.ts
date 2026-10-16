import { useSyncExternalStore } from "react";

/**
 * How the sessions tab of the sidebar lists sessions: every project as a
 * group of the one tree ("tree", the default), or the current project only,
 * under a project picker ("dropdown", the pre-0.12 sidebar's shape).
 */
export type SessionListStyle = "tree" | "dropdown";

export const SESSION_LIST_STYLE_STORAGE_KEY = "pi-web:sidebar-session-style";
export const SESSION_LIST_STYLE_DEFAULT: SessionListStyle = "tree";

export function parseSessionListStyle(raw: string | null): SessionListStyle {
  return raw === "dropdown" ? "dropdown" : SESSION_LIST_STYLE_DEFAULT;
}

function readStoredStyle(): SessionListStyle {
  try {
    return parseSessionListStyle(window.localStorage.getItem(SESSION_LIST_STYLE_STORAGE_KEY));
  } catch {
    return SESSION_LIST_STYLE_DEFAULT;
  }
}

let style: SessionListStyle | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): SessionListStyle {
  if (style === null) style = readStoredStyle();
  return style;
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

// Another tab chose; `key` is null when that tab cleared its storage.
function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== SESSION_LIST_STYLE_STORAGE_KEY) return;
  const next = readStoredStyle();
  if (next === style) return;
  style = next;
  notify();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener("storage", onStorage);
    // Nobody listened for another tab's choice meanwhile.
    style = readStoredStyle();
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function setSessionListStyle(next: SessionListStyle): void {
  if (next === getSnapshot()) return;
  style = next;
  try {
    window.localStorage.setItem(SESSION_LIST_STYLE_STORAGE_KEY, next);
  } catch {
    // Applies in memory even if the browser cannot save it.
  }
  notify();
}

export function useSessionListStyle(): SessionListStyle {
  return useSyncExternalStore(subscribe, getSnapshot, () => SESSION_LIST_STYLE_DEFAULT);
}
