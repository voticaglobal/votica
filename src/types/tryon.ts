export type EarringOption = {
  id: string;
  label: string;
  image: string;
  /** Display width in px at scale 1 — height is derived from the image's own aspect ratio. */
  displayWidth: number;
  /** Distance from the hinge point to the earring's own visual center, in px. */
  chainLength: number;
};

/** One accessory the customer has added to the photo — its own pin point and physics instance. */
export type PlacedAccessory = {
  id: string;
  option: EarringOption;
  anchorPx: { x: number; y: number };
};
