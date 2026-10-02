import type { EarringOption } from "../types/tryon";

export const DEFAULT_EAR_PHOTOS: { id: string; label: string; image: string }[] = [
  { id: "ear-1", label: "Sample ear", image: "/votica-assets/ear.png" },
  { id: "ear-2", label: "Sample ear (side)", image: "/votica-assets/ear2_a.png" },
];

export const EARRING_OPTIONS: EarringOption[] = [
  {
    id: "vintage-pendant",
    label: "Vintage Pendant",
    image: "/votica-assets/ACC_2.png",
    displayWidth: 64,
    chainLength: 12,
  },
  {
    id: "flower-tassel",
    label: "Flower Tassel",
    image: "/votica-assets/ACC_1.png",
    displayWidth: 46,
    chainLength: 10,
  },
];

/** Matches the existing studio's 5-charm cap — keeps a composed look craftable and the canvas legible. */
export const MAX_ACCESSORIES = 5;
