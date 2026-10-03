import { getItem, setItem, StorageKeys } from "./storage";
import type { CharmDesign } from "../types/charmStudio";

/**
 * Archive of every charm design this browser has ever created, keyed by id —
 * separate from `currentCharmDesign` (which only tracks the one design the
 * customer is actively editing). Without this, starting a new design would
 * silently discard the version history of whatever was submitted for review
 * before it, and the admin screen would have nothing to look up.
 */
export function listCharmDesigns(): CharmDesign[] {
  return getItem<CharmDesign[]>(StorageKeys.charmDesigns, []);
}

export function getCharmDesignById(id: string): CharmDesign | undefined {
  return listCharmDesigns().find((d) => d.id === id);
}

export function upsertCharmDesign(design: CharmDesign): void {
  const all = listCharmDesigns();
  const idx = all.findIndex((d) => d.id === design.id);
  if (idx === -1) {
    setItem(StorageKeys.charmDesigns, [design, ...all]);
  } else {
    const next = [...all];
    next[idx] = design;
    setItem(StorageKeys.charmDesigns, next);
  }
}
