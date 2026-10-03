import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { PartShape } from "./PartShape";
import type { PlacedItem } from "../../types/builder";

export function PlacedItemView({
  placed,
  zoom,
  selected,
  onSelect,
  onMove,
}: {
  placed: PlacedItem;
  zoom: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (dx: number, dy: number) => void;
}) {
  const dragFrom = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onSelect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragFrom.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragFrom.current) return;
    const dx = (e.clientX - dragFrom.current.x) / zoom;
    const dy = (e.clientY - dragFrom.current.y) / zoom;
    dragFrom.current = { x: e.clientX, y: e.clientY };
    onMove(dx, dy);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragFrom.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const { item, x, y } = placed;

  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
      style={{
        left: x,
        top: y,
        width: item.width + 16,
        height: item.height + 16,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {selected && (
        <div
          className="pointer-events-none absolute rounded-sm border border-champagne"
          style={{ width: item.width + 8, height: item.height + 8 }}
        />
      )}
      <PartShape item={item} />
      {selected ? (
        <span className="pointer-events-none absolute -bottom-1.5 h-1.5 w-1.5 rounded-full bg-champagne" />
      ) : (
        <span className="pointer-events-none absolute -bottom-1 h-1 w-1 rounded-full bg-graphite/40" />
      )}
    </div>
  );
}
