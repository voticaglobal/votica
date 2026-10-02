import type { MaterialType, ProductType } from "../types/jewelry";

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  silver: "925 Silver",
  "gold-vermeil": "Gold Vermeil",
  "rose-gold": "Rose Gold",
};

export const PRODUCT_LABELS: Record<ProductType, string> = {
  "hoop-earring": "Hoop Earring",
  pendant: "Pendant",
  ring: "Ring",
  necklace: "Necklace",
};
