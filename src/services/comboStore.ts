import { getItem, setItem, StorageKeys } from "./storage";
import { generateId } from "../lib/utils";
import type { PartCombo, PlacedPartNode } from "../types/combo";

/**
 * Only what's needed to rebuild the combo is persisted — partId, parent
 * links, and which child-point each uses. No per-frame physics state is
 * saved; reload always starts from the stable rest pose, which the physics
 * hook reconstructs from this data on mount.
 */
const DEFAULT_BASE_HOOP_PART_ID = "M_082_02";

export function loadCombo(): PartCombo {
  return getItem<PartCombo>(StorageKeys.partCombo, emptyCombo());
}

export function saveCombo(combo: PartCombo): void {
  setItem(StorageKeys.partCombo, { ...combo, updatedAt: new Date().toISOString() });
}

export function emptyCombo(): PartCombo {
  const now = new Date().toISOString();
  return { id: generateId("combo"), baseHoopPartId: DEFAULT_BASE_HOOP_PART_ID, nodes: [], version: 1, createdAt: now, updatedAt: now };
}

export function addNode(combo: PartCombo, partId: string, parentUid: string | null, parentChildPointId: string): PartCombo {
  const node: PlacedPartNode = { uid: generateId("node"), partId, parentUid, parentChildPointId };
  return { ...combo, nodes: [...combo.nodes, node] };
}

/** Removing a node also removes anything hanging off it, so the chain never has an orphaned parentUid. */
export function removeNode(combo: PartCombo, uid: string): PartCombo {
  const toRemove = new Set([uid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of combo.nodes) {
      if (n.parentUid && toRemove.has(n.parentUid) && !toRemove.has(n.uid)) {
        toRemove.add(n.uid);
        changed = true;
      }
    }
  }
  return { ...combo, nodes: combo.nodes.filter((n) => !toRemove.has(n.uid)) };
}
