import type { PointerEvent as ReactPointerEvent } from "react";
import type { CharmInstance } from "../../types/jewelry";
import { CharmShape, CharmJumpRing, CHARM_HANG_OFFSET } from "../../data/charms";

export function CharmNode({
  charm,
  x,
  y,
  selected,
  dragging,
  onPointerDown,
  onSelect,
  onMove,
  onDelete,
}: {
  charm: CharmInstance;
  x: number;
  y: number;
  selected: boolean;
  dragging: boolean;
  onPointerDown: (e: ReactPointerEvent<SVGGElement>) => void;
  onSelect: () => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${charm.rotation}) scale(${charm.scale})`}
      onPointerDown={onPointerDown}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`${charm.type} charm${selected ? ", selected" : ""}. Use left and right arrow keys to move it along the hoop.`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          onSelect();
          onMove(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          onSelect();
          onMove(1);
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          onDelete();
        }
      }}
      style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
      className="outline-none"
    >
      {selected && (
        <circle
          cy={CHARM_HANG_OFFSET / 2}
          r={15}
          fill="none"
          stroke="#c9a86a"
          strokeWidth={1}
          strokeDasharray="2.5 2.5"
          opacity={dragging ? 0.9 : 0.6}
        />
      )}
      <g filter="url(#vandida-charm-shadow)">
        <CharmJumpRing material={charm.material} />
        <g transform={`translate(0 ${CHARM_HANG_OFFSET})`}>
          <CharmShape type={charm.type} material={charm.material} text={charm.text} customAssetUrl={charm.customAssetUrl} />
        </g>
      </g>
    </g>
  );
}
