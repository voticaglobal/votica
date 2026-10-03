import raw from "./parts.generated.json";
import { ATTACHMENT_OVERRIDES } from "./attachmentOverrides";
import type { Part, PartCategory } from "../types/catalog";

type RawPart = {
  id: string;
  sku: string;
  sourceFile: string;
  sourceFolder: string;
  imageUrl: string;
  category: PartCategory;
  reviewStatus: Part["reviewStatus"];
  canvasPixelWidth: number | null;
  canvasPixelHeight: number | null;
  visualFootprintPx: { width: number; height: number } | null;
  visualBounds: { x: number; y: number; width: number; height: number } | null;
};

const CATEGORY_LABEL: Record<PartCategory, string> = {
  base: "Base finding",
  connecting: "Connecting part",
  charm: "Charm",
  decoration: "Decoration",
  unclassified: "Unclassified part",
};

/**
 * 304 real jewelry-part photos (from the supplied parts archive), each kept
 * under its original filename-derived id. Every field beyond id/category/image
 * is left unset until an operator confirms it — see `types/catalog.ts`.
 */
export const PARTS_CATALOG: Part[] = (raw as RawPart[]).map((p) => ({
  id: p.id,
  sku: p.sku,
  name: `${CATEGORY_LABEL[p.category]} ${p.id}`,
  category: p.category,
  imageUrl: p.imageUrl,
  sourceFile: p.sourceFile,
  reviewStatus: p.reviewStatus,
  canvasPixelWidth: p.canvasPixelWidth,
  canvasPixelHeight: p.canvasPixelHeight,
  visualFootprintPx: p.visualFootprintPx,
  visualBounds: p.visualBounds,
  attachment: ATTACHMENT_OVERRIDES[p.id],
}));

/** Parts with a real, manually-set attachment point — the only ones the combo/physics preview offers. */
export function getAttachableParts(category?: PartCategory): Part[] {
  return PARTS_CATALOG.filter(
    (p) => p.attachment?.reviewStatus === "manually_set" && (!category || p.category === category),
  );
}

export function getPart(id: string): Part | undefined {
  return PARTS_CATALOG.find((p) => p.id === id);
}

export function getPartsByCategory(category: PartCategory): Part[] {
  return PARTS_CATALOG.filter((p) => p.category === category);
}

export const BASE_FINDINGS = getPartsByCategory("base");
export const REAL_CHARM_PARTS = getPartsByCategory("charm");

export const PARTS_CATALOG_SUMMARY = PARTS_CATALOG.reduce<Record<string, number>>((acc, p) => {
  acc[p.category] = (acc[p.category] ?? 0) + 1;
  return acc;
}, {});
