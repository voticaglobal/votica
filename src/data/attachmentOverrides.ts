import type { PartAttachment } from "../types/catalog";

/**
 * Hand-set attachment points, keyed by Part id. This is exactly the output
 * the dev attachment-point editor (/dev/attachment-editor) produces — these
 * three entries were set the same way the editor would (visually, against
 * each part's own measured alpha bounding box), just before the editor UI
 * existed yet. Merge new entries here (or replace with the editor's export)
 * as more parts get calibrated.
 *
 * `reviewStatus: "manually_set"` is the only status the combo canvas's
 * physics/snap system will treat as real — a part without an entry here can
 * still be browsed in the catalog, but won't be offered in the physics combo
 * preview. Nothing here is a manufacturing claim (see PartAttachment's doc).
 */
export const ATTACHMENT_OVERRIDES: Record<string, PartAttachment> = {
  // Large open hoop base (confirmed base finding, see data/parts.ts BASE_FINDINGS).
  // Bbox (normalized): x 0.356–0.650, y 0.29–0.68. Bottom-of-hoop (6 o'clock,
  // where a real earring's dangle sits) ≈ bbox bottom-center.
  M_082_02: {
    childAttachmentPoints: [
      { id: "hoop-bottom", point: { x: 0.503, y: 0.675 }, acceptsCategories: ["connecting", "charm"] },
    ],
    reviewStatus: "manually_set",
  },

  // Bar connector — a straight link with its own loop at each end. Bbox:
  // x 0.486–0.516 (narrow), y 0.4025–0.6025. Top loop hangs from the base;
  // bottom loop accepts a charm.
  M_043: {
    attachmentPoint: { x: 0.501, y: 0.412 },
    childAttachmentPoints: [
      { id: "connector-bottom", point: { x: 0.501, y: 0.593 }, acceptsCategories: ["charm", "decoration"] },
    ],
    displayScale: 1,
    restAngle: 0,
    reviewStatus: "manually_set",
  },

  // Textured heart charm — single loop at top-center. Bbox: x 0.418–0.582, y 0.4025–0.61.
  S_043: {
    attachmentPoint: { x: 0.5, y: 0.412 },
    displayScale: 1,
    restAngle: 0,
    reviewStatus: "manually_set",
  },
};
