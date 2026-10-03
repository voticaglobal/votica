/**
 * A real-parts "hoop -> connector -> charm (-> ...)" combination, physically
 * hung and swingable. Distinct from `JewelryDesign.charms` (the existing
 * vector/AI-charm Studio) and `CharmDesign` (the single AI charm flow) — this
 * is specifically the Monomy-style multi-part physical assembly.
 */
export type PlacedPartNode = {
  uid: string;
  partId: string;
  /** Null = hangs directly from the base hoop's own child attachment point. */
  parentUid: string | null;
  /** Which of the parent's (or the hoop's) childAttachmentPoints this node uses. */
  parentChildPointId: string;
};

export type PartCombo = {
  id: string;
  /** Which real base Part (from data/parts.ts BASE_FINDINGS, with a calibrated attachment) is shown, fixed in place. */
  baseHoopPartId: string;
  nodes: PlacedPartNode[];
  version: number;
  createdAt: string;
  updatedAt: string;
};
