import type { CSSProperties } from "react";
import type { NormalizedPoint, Part } from "../types/catalog";

/**
 * All attachment points are stored normalized against a part's FULL original
 * canvas (e.g. 500x400), but the part is always *displayed* cropped to its
 * visualBounds (the alpha-channel bounding box) so transparent margin doesn't
 * make it look tiny. These helpers convert between the two spaces so a point
 * set against the original image still lands in the right place after crop.
 */

/** A point in full-canvas-normalized space -> normalized space relative to the cropped (visualBounds) box. */
export function toCropRelative(point: NormalizedPoint, bounds: Part["visualBounds"]): NormalizedPoint {
  if (!bounds || bounds.width === 0 || bounds.height === 0) return point;
  return {
    x: (point.x - bounds.x) / bounds.width,
    y: (point.y - bounds.y) / bounds.height,
  };
}

/** The reverse of toCropRelative — used by the attachment-point editor, which clicks on the cropped display. */
export function fromCropRelative(point: NormalizedPoint, bounds: Part["visualBounds"]): NormalizedPoint {
  if (!bounds) return point;
  return {
    x: bounds.x + point.x * bounds.width,
    y: bounds.y + point.y * bounds.height,
  };
}

/**
 * Display size (px) for a part cropped to its visualBounds, fit within a
 * `targetBox` square (the LARGER of width/height equals targetBox) rather
 * than a fixed width — several real parts here are thin and tall (a
 * connector bar) or thin and wide, and fixing width alone would blow up the
 * other dimension (a 15:80px connector at width=36 renders ~190px tall).
 */
export function displaySizeForWidth(part: Part, targetBox: number): { width: number; height: number } {
  const bounds = part.visualBounds;
  if (!bounds || !part.canvasPixelWidth || !part.canvasPixelHeight) {
    return { width: targetBox, height: targetBox };
  }
  const cropPxWidth = bounds.width * part.canvasPixelWidth;
  const cropPxHeight = bounds.height * part.canvasPixelHeight;
  const scale = targetBox / Math.max(cropPxWidth, cropPxHeight);
  return { width: cropPxWidth * scale, height: cropPxHeight * scale };
}

/**
 * CSS for an <img> tag showing the FULL original image but visually cropped
 * to visualBounds via object-fit:none + object-position math — keeps the
 * image a single <img src> (simple, cacheable) rather than needing a sprite
 * sheet or canvas crop, at the cost of rendering slightly more pixels than
 * strictly shown.
 */
export function cropStyle(part: Part, displayWidth: number, displayHeight: number): CSSProperties {
  const bounds = part.visualBounds;
  if (!bounds || !part.canvasPixelWidth || !part.canvasPixelHeight) {
    return { width: displayWidth, height: displayHeight, objectFit: "contain" };
  }
  const scale = displayWidth / (bounds.width * part.canvasPixelWidth);
  const fullWidth = part.canvasPixelWidth * scale;
  const fullHeight = part.canvasPixelHeight * scale;
  const offsetX = -(bounds.x * part.canvasPixelWidth) * scale;
  const offsetY = -(bounds.y * part.canvasPixelHeight) * scale;
  return {
    position: "absolute",
    left: offsetX,
    top: offsetY,
    width: fullWidth,
    height: fullHeight,
    maxWidth: "none",
  };
}
