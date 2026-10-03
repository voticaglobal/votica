import { forwardRef } from "react";
import { Trash2 } from "lucide-react";
import { cropStyle, displaySizeForWidth } from "../../lib/partGeometry";
import type { Part } from "../../types/catalog";

/**
 * One physically-hung part. The hook drives this element's `transform`
 * imperatively (translate to the body's live position + rotate to its live
 * angle) — this component never re-renders per physics frame.
 */
export const PartNodeView = forwardRef<
  HTMLDivElement,
  {
    part: Part;
    displayWidth: number;
    selected: boolean;
    editable: boolean;
    onSelect: () => void;
    onDelete: () => void;
  }
>(function PartNodeView({ part, displayWidth, selected, editable, onSelect, onDelete }, ref) {
  const size = displaySizeForWidth(part, displayWidth);

  return (
    <div
      ref={ref}
      data-combo-node={part.id}
      className="absolute left-0 top-0 origin-center touch-none"
      style={{ width: size.width, height: size.height, marginLeft: -size.width / 2, marginTop: -size.height / 2 }}
      onClick={(e) => {
        e.stopPropagation();
        if (editable) onSelect();
      }}
    >
      <div className="relative h-full w-full overflow-hidden">
        <img
          src={part.imageUrl}
          alt={part.name}
          draggable={false}
          style={cropStyle(part, size.width, size.height)}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      {selected && (
        <>
          <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-champagne" />
          <button
            type="button"
            aria-label={`Remove ${part.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-graphite text-ivory shadow"
          >
            <Trash2 size={12} />
          </button>
        </>
      )}
    </div>
  );
});
