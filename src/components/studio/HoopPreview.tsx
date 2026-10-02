import type { JewelryDesign } from "../../types/jewelry";
import { MaterialDefs, CharmShape, CharmJumpRing, CHARM_HANG_OFFSET } from "../../data/charms";
import { HOOP_ATTACHMENT_POINTS } from "../../data/attachmentPoints";
import { HoopShape } from "./HoopShape";
import { cn } from "../../lib/utils";

/** Read-only render of a design — used on the homepage, storefronts, and the preview screen. */
export function HoopPreview({ design, className }: { design: JewelryDesign; className?: string }) {
  return (
    <svg viewBox="0 0 200 220" className={cn("h-full w-full", className)} role="img" aria-label={`${design.name} preview`}>
      <MaterialDefs />
      <HoopShape material={design.material} />
      {design.charms.map((charm) => {
        const point = HOOP_ATTACHMENT_POINTS.find((p) => p.id === charm.attachmentPointId);
        if (!point) return null;
        return (
          <g
            key={charm.id}
            transform={`translate(${point.x} ${point.y}) rotate(${charm.rotation}) scale(${charm.scale})`}
          >
            <g filter="url(#vandida-charm-shadow)">
              <CharmJumpRing material={charm.material} />
              <g transform={`translate(0 ${CHARM_HANG_OFFSET})`}>
                <CharmShape type={charm.type} material={charm.material} text={charm.text} customAssetUrl={charm.customAssetUrl} />
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
