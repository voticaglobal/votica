export type EarringOption = {
  id: string;
  label: string;
  image: string;
  /** Display width in px at scale 1 — height is derived from the image's own aspect ratio. */
  displayWidth: number;
  /** Distance from the hinge point to the earring's own visual center, in px. */
  chainLength: number;
};

export type EarAnchor = {
  /** 0–1, relative to the rendered photo's own width/height. */
  xPct: number;
  yPct: number;
};
