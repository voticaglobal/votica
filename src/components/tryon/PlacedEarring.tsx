import { useRef, type RefObject } from "react";
import { Trash2 } from "lucide-react";
import { useEarringPhysics } from "../../hooks/useEarringPhysics";
import type { PlacedAccessory } from "../../types/tryon";

export function PlacedEarring({
  accessory,
  containerRef,
  selected,
  onSelect,
  onDelete,
}: {
  accessory: PlacedAccessory;
  containerRef: RefObject<HTMLDivElement | null>;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEarringPhysics({
    containerRef,
    imgRef,
    anchorPx: accessory.anchorPx,
    chainLength: accessory.option.chainLength,
  });

  const { x, y } = accessory.anchorPx;

  return (
    <>
      <div
        className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-champagne shadow"
        style={{ left: x, top: y }}
      />
      <img
        ref={imgRef}
        src={accessory.option.image}
        alt={accessory.option.label}
        draggable={false}
        className="absolute origin-top cursor-grab touch-none active:cursor-grabbing"
        style={{
          left: x,
          top: y,
          width: accessory.option.displayWidth,
          filter: selected ? "drop-shadow(0 0 0 2px #c9a86a)" : undefined,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      />
      {selected && (
        <button
          type="button"
          aria-label={`Remove ${accessory.option.label}`}
          className="absolute flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-graphite text-ivory shadow"
          style={{ left: x + accessory.option.displayWidth / 2 + 4, top: y }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </>
  );
}
