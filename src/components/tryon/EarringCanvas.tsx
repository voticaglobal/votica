import { useRef, type MouseEvent } from "react";
import { MapPin } from "lucide-react";
import { PlacedEarring } from "./PlacedEarring";
import type { EarringOption, PlacedAccessory } from "../../types/tryon";

export function EarringCanvas({
  photoUrl,
  placed,
  pendingOption,
  selectedId,
  onPlace,
  onSelect,
  onDelete,
}: {
  photoUrl: string;
  placed: PlacedAccessory[];
  pendingOption: EarringOption | null;
  selectedId: string | null;
  onPlace: (pos: { x: number; y: number }) => void;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = (e: MouseEvent) => {
    if (!pendingOption) {
      onSelect(null);
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    onPlace({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none overflow-hidden rounded-3xl bg-stone"
      onClick={handleContainerClick}
    >
      <img src={photoUrl} alt="Ear reference" draggable={false} className="block w-full" />

      {pendingOption && (
        <div className="absolute inset-0 flex items-center justify-center bg-graphite/15 backdrop-blur-[1px]">
          <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-graphite shadow">
            <MapPin size={15} />
            Tap where it should hang
          </span>
        </div>
      )}

      {placed.map((p) => (
        <PlacedEarring
          key={p.id}
          accessory={p}
          containerRef={containerRef}
          selected={selectedId === p.id}
          onSelect={() => onSelect(p.id)}
          onDelete={() => onDelete(p.id)}
        />
      ))}
    </div>
  );
}
