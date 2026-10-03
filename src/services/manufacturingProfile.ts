import type { ManufacturingProfile } from "../types/charmStudio";

/**
 * Single source of truth for charm manufacturing constraints. Nothing here is a
 * guess — every field below is unset because no real spec has been confirmed
 * yet. When ops provides real numbers, set them here (or load from wherever
 * this ends up being administered) and the rest of the app picks them up
 * automatically via `getManufacturingProfile()` / `getUnconfirmedFields()`.
 */
const MANUFACTURING_PROFILE: ManufacturingProfile = {
  // loopInnerDiameterMm: undefined,
  // loopWireThicknessMm: undefined,
  // connectorDimensionsMm: undefined,
  // hoopPassthroughNote: undefined,
  // minBodyWidthMm: undefined,
  // minBodyHeightMm: undefined,
  // minBodyThicknessMm: undefined,
  // maxWeightG: undefined,
  sizePresets: [
    { id: "size-review", label: "Standard (exact size to be confirmed)" },
  ],
};

export function getManufacturingProfile(): ManufacturingProfile {
  return MANUFACTURING_PROFILE;
}

const SPEC_FIELD_LABELS: Record<string, string> = {
  loopInnerDiameterMm: "Loop inner diameter",
  loopWireThicknessMm: "Loop wire thickness",
  connectorDimensionsMm: "Connector dimensions",
  hoopPassthroughNote: "Hoop pass-through / assembly method",
  minBodyWidthMm: "Minimum body width",
  minBodyHeightMm: "Minimum body height",
  minBodyThicknessMm: "Minimum body thickness",
  maxWeightG: "Maximum weight",
};

/** Human-readable list of which manufacturing specs are still unconfirmed — drives "needs spec review" UI. */
export function getUnconfirmedSpecFields(): string[] {
  const profile = getManufacturingProfile();
  return Object.entries(SPEC_FIELD_LABELS)
    .filter(([key]) => profile[key as keyof ManufacturingProfile] === undefined)
    .map(([, label]) => label);
}
