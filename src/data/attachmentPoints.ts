import type { AttachmentPoint, CharmInstance } from "../types/jewelry";

// Hoop geometry shared with HoopRenderer: circle center (100, 128), radius 62,
// open at the top ~40deg for the ear-post gap.
export const HOOP_CENTER = { x: 100, y: 128 };
export const HOOP_RADIUS = 62;

function buildHoopAttachmentPoints(): AttachmentPoint[] {
  const points: AttachmentPoint[] = [];
  const count = 9;
  const spread = 150; // degrees of arc covered across the lower hoop
  const startAngle = 270 - spread / 2; // 270deg = straight down

  for (let i = 0; i < count; i++) {
    const angleDeg = startAngle + (spread / (count - 1)) * i;
    const angleRad = (angleDeg * Math.PI) / 180;
    points.push({
      id: `hoop-ap-${i}`,
      x: HOOP_CENTER.x + HOOP_RADIUS * Math.cos(angleRad),
      y: HOOP_CENTER.y + HOOP_RADIUS * Math.sin(angleRad),
      rotation: angleDeg + 90,
    });
  }

  return points;
}

export const HOOP_ATTACHMENT_POINTS: AttachmentPoint[] = buildHoopAttachmentPoints();

/** Falls back to HOOP_ATTACHMENT_POINTS if `points` is empty, so callers always get a real point back. */
export function findNearestAttachmentPoint(
  x: number,
  y: number,
  points: AttachmentPoint[] = HOOP_ATTACHMENT_POINTS,
): AttachmentPoint {
  const candidates = points.length > 0 ? points : HOOP_ATTACHMENT_POINTS;
  let nearest = candidates[0];
  let nearestDist = Infinity;
  for (const point of candidates) {
    const dist = Math.hypot(point.x - x, point.y - y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = point;
    }
  }
  return nearest;
}

/** The attachment points currently in use by other charms — shared by drag-snap, keyboard nudge, and add/duplicate. */
export function getOccupiedAttachmentPointIds(
  charms: CharmInstance[],
  excludeCharmId?: string | null,
): Set<string> {
  return new Set(
    charms.filter((c) => c.id !== excludeCharmId).map((c) => c.attachmentPointId),
  );
}

export function getFreeAttachmentPoints(charms: CharmInstance[], excludeCharmId?: string | null): AttachmentPoint[] {
  const occupied = getOccupiedAttachmentPointIds(charms, excludeCharmId);
  return HOOP_ATTACHMENT_POINTS.filter((p) => !occupied.has(p.id));
}
