import { Plus, Ear, Trash2, ZoomIn } from "lucide-react";
import { PlacedItemView } from "./PlacedItemView";
import { BUILDER_EAR_PHOTO } from "../../data/builder";
import type { PlacedItem } from "../../types/builder";
import { cn } from "../../lib/utils";

export function CustomizeCanvas({
  placed,
  selectedUid,
  zoom,
  previewMode,
  onSelect,
  onMove,
  onAdd,
  onDelete,
  onTogglePreview,
  onCycleZoom,
}: {
  placed: PlacedItem[];
  selectedUid: string | null;
  zoom: number;
  previewMode: boolean;
  onSelect: (uid: string | null) => void;
  onMove: (uid: string, dx: number, dy: number) => void;
  onAdd: () => void;
  onDelete: () => void;
  onTogglePreview: () => void;
  onCycleZoom: () => void;
}) {
  return (
    <div className="relative flex-1 overflow-hidden bg-stone" onPointerDown={() => onSelect(null)}>
      {previewMode && (
        <img
          src={BUILDER_EAR_PHOTO}
          alt="Ear reference"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
      )}

      <div
        className="absolute inset-0 origin-center transition-transform"
        style={{ transform: `scale(${zoom})` }}
      >
        {placed.map((p) => (
          <PlacedItemView
            key={p.uid}
            placed={p}
            zoom={zoom}
            selected={selectedUid === p.uid}
            onSelect={() => onSelect(p.uid)}
            onMove={(dx, dy) => onMove(p.uid, dx, dy)}
          />
        ))}
      </div>

      <div className="absolute right-4 top-4 flex flex-col gap-3">
        <button
          type="button"
          aria-label="Add parts"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-graphite bg-ivory text-graphite shadow"
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          aria-label="Toggle ear preview"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePreview();
          }}
          className={cn(
            "flex h-11 w-11 flex-col items-center justify-center rounded-full text-[10px] font-medium text-ivory shadow",
            previewMode ? "bg-champagne text-graphite" : "bg-graphite",
          )}
        >
          <Ear size={16} />
          preview
        </button>
        <button
          type="button"
          aria-label="Delete selected part"
          disabled={!selectedUid}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex h-11 w-11 flex-col items-center justify-center rounded-full bg-graphite text-[10px] font-medium text-ivory shadow disabled:opacity-30"
        >
          <Trash2 size={16} />
          delete
        </button>
      </div>

      <button
        type="button"
        aria-label="Zoom"
        onClick={(e) => {
          e.stopPropagation();
          onCycleZoom();
        }}
        className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-graphite text-ivory shadow"
      >
        <ZoomIn size={18} />
      </button>
    </div>
  );
}
