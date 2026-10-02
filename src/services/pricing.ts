import type { JewelryDesign, MaterialType, ProductType } from "../types/jewelry";

/** Single source of truth for MVP pricing. Nothing outside this file hard-codes a price. */
export const PRICING = {
  base: {
    "hoop-earring": 89,
    pendant: 79,
    ring: 99,
    necklace: 109,
  } satisfies Record<ProductType, number>,
  charm: {
    standard: 15,
    custom: 30,
  },
  materialSurcharge: {
    silver: 0,
    "gold-vermeil": 25,
    "rose-gold": 20,
  } satisfies Record<MaterialType, number>,
};

export function calculateEstimatedPrice(design: Pick<JewelryDesign, "productType" | "material" | "charms">): number {
  const base = PRICING.base[design.productType] ?? PRICING.base["hoop-earring"];
  const materialSurcharge = PRICING.materialSurcharge[design.material] ?? 0;
  const charmsTotal = design.charms.reduce((sum, charm) => {
    return sum + (charm.type === "custom" ? PRICING.charm.custom : PRICING.charm.standard);
  }, 0);

  return base + materialSurcharge + charmsTotal;
}

export function estimateProductionWindow(): string {
  return "10–14 days";
}
