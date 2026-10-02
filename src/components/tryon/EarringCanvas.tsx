import { useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { useEarringPhysics } from "../../hooks/useEarringPhysics";
import type { EarringOption } from "../../types/tryon";

export function EarringCanvas({ photoUrl, earring }: { photoUrl: string; earring: EarringOption }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [anchorPx, setAnchorPx] = useState<{ x: number; y: number } | null>(null);

  useEarringPhysics({ containerRef, imgRef, anchorPx, chainLength: earring.chainLength });

  const handlePlace = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAnchorPx({ x: clientX - rect.left, y: clientY - rect.top });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none overflow-hidden rounded-3xl bg-stone"
      onClick={(e) => handlePlace(e.clientX, e.clientY)}
    >
      <img src={photoUrl} alt="Ear reference" draggable={false} className="block w-full" />

      {!anchorPx && (
        <div className="absolute inset-0 flex items-center justify-center bg-graphite/15 backdrop-blur-[1px]">
          <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-graphite shadow">
            <MapPin size={15} />
            Tap your earlobe to try it on
          </span>
        </div>
      )}

      {anchorPx && (
        <>
          <button
            type="button"
            aria-label="Move the earring's pivot point"
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-champagne shadow"
            style={{ left: anchorPx.x, top: anchorPx.y }}
            onClick={(e) => e.stopPropagation()}
          />
          <img
            ref={imgRef}
            src={earring.image}
            alt={earring.label}
            draggable={false}
            className="absolute origin-top cursor-grab touch-none active:cursor-grabbing"
            style={{ left: anchorPx.x, top: anchorPx.y, width: earring.displayWidth }}
            onClick={(e) => e.stopPropagation()}
          />
        </>
      )}
    </div>
  );
}
