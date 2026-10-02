import type { CharmInstance, JewelryDesign, ValidationResult } from "../types/jewelry";
import { HOOP_ATTACHMENT_POINTS } from "../data/attachmentPoints";

export const MAX_CHARMS = 5;
export const MIN_CHARM_SCALE = 0.6;
export const MAX_CHARM_SCALE = 1.5;
const MIN_CHARM_DISTANCE = 16;

const FRIENDLY_FALLBACK = "Let's place it where it can be crafted beautifully.";

export function canAddCharm(design: Pick<JewelryDesign, "charms">): boolean {
  return design.charms.length < MAX_CHARMS;
}

export function validateJewelryDesign(design: JewelryDesign): ValidationResult {
  const issues: ValidationResult["issues"] = [];

  if (design.charms.length > MAX_CHARMS) {
    issues.push({ message: `Let's keep it to ${MAX_CHARMS} charms so each one gets room to shine.` });
  }

  for (const charm of design.charms) {
    if (charm.scale < MIN_CHARM_SCALE || charm.scale > MAX_CHARM_SCALE) {
      issues.push({ field: charm.id, message: FRIENDLY_FALLBACK });
    }
    const point = HOOP_ATTACHMENT_POINTS.find((p) => p.id === charm.attachmentPointId);
    if (!point) {
      issues.push({ field: charm.id, message: FRIENDLY_FALLBACK });
    }
  }

  issues.push(...findOverlapIssues(design.charms));

  return { isValid: issues.length === 0, issues };
}

function findOverlapIssues(charms: CharmInstance[]): ValidationResult["issues"] {
  const issues: ValidationResult["issues"] = [];
  const seenPoints = new Set<string>();

  for (const charm of charms) {
    if (seenPoints.has(charm.attachmentPointId)) {
      issues.push({
        field: charm.id,
        message: "Two charms want the same spot — let's give each one its own place.",
      });
    }
    seenPoints.add(charm.attachmentPointId);
  }

  for (let i = 0; i < charms.length; i++) {
    for (let j = i + 1; j < charms.length; j++) {
      const a = HOOP_ATTACHMENT_POINTS.find((p) => p.id === charms[i].attachmentPointId);
      const b = HOOP_ATTACHMENT_POINTS.find((p) => p.id === charms[j].attachmentPointId);
      if (!a || !b) continue;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < MIN_CHARM_DISTANCE) {
        issues.push({
          message: "These two charms are sitting close together — let's give them a little more room.",
        });
      }
    }
  }

  return issues;
}
