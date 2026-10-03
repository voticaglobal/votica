/**
 * Thin localStorage abstraction. Keeping every read/write behind this module means
 * swapping in a real backend (Supabase, etc.) later only touches this file.
 */
const NAMESPACE = "vandida";

function key(name: string): string {
  return `${NAMESPACE}:${name}`;
}

export function getItem<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key(name));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setItem<T>(name: string, value: T): void {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
  } catch {
    // storage unavailable (private mode, quota) — fail silently, MVP has no offline queue
  }
}

export function removeItem(name: string): void {
  try {
    localStorage.removeItem(key(name));
  } catch {
    // ignore
  }
}

export function appendToList<T>(name: string, item: T, max = 20): T[] {
  const list = getItem<T[]>(name, []);
  const next = [item, ...list].slice(0, max);
  setItem(name, next);
  return next;
}

export const StorageKeys = {
  currentDesign: "current-design",
  recentDesigns: "recent-designs",
  creatorProfile: "creator-profile",
  collections: "collections",
  productionRequests: "production-requests",
  currentCharmDesign: "current-charm-design",
  charmDesigns: "charm-designs",
  productionReviewRequests: "production-review-requests",
} as const;
