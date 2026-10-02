import type { MaterialType } from "../../types/jewelry";
import { materialGradientId } from "../../data/charms";
import { HOOP_CENTER, HOOP_RADIUS } from "../../data/attachmentPoints";

export function HoopShape({ material }: { material: MaterialType }) {
  return (
    <>
      <circle
        cx={HOOP_CENTER.x}
        cy={HOOP_CENTER.y}
        r={HOOP_RADIUS}
        fill="none"
        stroke={`url(#${materialGradientId(material)})`}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <path
        d={`M ${HOOP_CENTER.x - HOOP_RADIUS * 0.5} ${HOOP_CENTER.y - HOOP_RADIUS * 0.82} A ${HOOP_RADIUS} ${HOOP_RADIUS} 0 0 1 ${HOOP_CENTER.x + HOOP_RADIUS * 0.55} ${HOOP_CENTER.y - HOOP_RADIUS * 0.78}`}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </>
  );
}
