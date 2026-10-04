import { useMemo, useRef } from "react";
import { Plus, ZoomIn, ZoomOut, PauseCircle, RotateCw } from "lucide-react";
import { PartNodeView } from "./PartNodeView";
import { usePartComboPhysics, type ComboPhysicsMode, type ComboPhysicsNode } from "../../hooks/usePartComboPhysics";
import { toCropRelative, displaySizeForWidth, cropStyle } from "../../lib/partGeometry";
import { getPart } from "../../data/parts";
import { cn } from "../../lib/utils";
import type { PartCombo } from "../../types/combo";
import type { ChildAttachmentPoint } from "../../types/catalog";

const HOOP_DISPLAY_WIDTH = 160;
const CANVAS_HEIGHT = 420;
const HOOP_TOP_OFFSET = 70;

export function ComboCanvas({
  combo,
  editMode,
  motionOn,
  selectedUid,
  onSelect,
  onDelete,
  onOpenSlotPicker,
  zoom,
  showHoop = true,
}: {
  combo: PartCombo;
  editMode: boolean;
  motionOn: boolean;
  selectedUid: string | null;
  onSelect: (uid: string | null) => void;
  onDelete: (uid: string) => void;
  onOpenSlotPicker: (parentUid: string | null, slot: ChildAttachmentPoint) => void;
  zoom: number;
  showHoop?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeElsRef = useRef(new Map<string, HTMLDivElement>());
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const hoopPart = getPart(combo.baseHoopPartId);
  const hoopSize = hoopPart ? displaySizeForWidth(hoopPart, HOOP_DISPLAY_WIDTH) : { width: 0, height: 0 };
  const hoopCenter = { x: 180, y: HOOP_TOP_OFFSET + hoopSize.height / 2 };

  const hoopSlot = hoopPart?.attachment?.childAttachmentPoints?.[0];
  const anchorPx = useMemo(() => {
    if (!hoopPart || !hoopSlot) return null;
    const rel = toCropRelative(hoopSlot.point, hoopPart.visualBounds);
    return {
      x: hoopCenter.x + (rel.x - 0.5) * hoopSize.width,
      y: hoopCenter.y + (rel.y - 0.5) * hoopSize.height,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoopPart?.id, hoopSize.width, hoopSize.height]);

  // Box-fit target (max of width/height), not a fixed width — M_043 (the
  // connector) is a thin ~15:80 bar, so a fixed-width box would blow its
  // height up to ~190px. connecting is sized bigger than charm so a thin
  // bar still reads clearly even though its *other* dimension stays small.
  const DISPLAY_WIDTH_BY_CATEGORY: Record<string, number> = { connecting: 56, charm: 70, decoration: 40 };

  const physicsNodes: ComboPhysicsNode[] = useMemo(() => {
    const out: ComboPhysicsNode[] = [];
    for (const node of combo.nodes) {
      const part = getPart(node.partId);
      if (!part?.attachment) continue;
      const displayWidth = DISPLAY_WIDTH_BY_CATEGORY[part.category] ?? 50;
      const size = displaySizeForWidth(part, displayWidth);

      const selfRel = part.attachment.attachmentPoint
        ? toCropRelative(part.attachment.attachmentPoint, part.visualBounds)
        : { x: 0.5, y: 0.1 };
      const selfAttachOffsetPx = { x: (selfRel.x - 0.5) * size.width, y: (selfRel.y - 0.5) * size.height };

      let parentChildOffsetPx: { x: number; y: number } | null = null;
      if (node.parentUid) {
        const parentNode = combo.nodes.find((n) => n.uid === node.parentUid);
        const parentPart = parentNode ? getPart(parentNode.partId) : undefined;
        const parentSlot = parentPart?.attachment?.childAttachmentPoints?.find(
          (s) => s.id === node.parentChildPointId,
        );
        if (parentPart && parentSlot) {
          const parentDisplayWidth = DISPLAY_WIDTH_BY_CATEGORY[parentPart.category] ?? 50;
          const parentSize = displaySizeForWidth(parentPart, parentDisplayWidth);
          const parentRel = toCropRelative(parentSlot.point, parentPart.visualBounds);
          parentChildOffsetPx = {
            x: (parentRel.x - 0.5) * parentSize.width,
            y: (parentRel.y - 0.5) * parentSize.height,
          };
        }
      }

      out.push({
        uid: node.uid,
        selfAttachOffsetPx,
        parentChildOffsetPx,
        parentUid: node.parentUid,
        radiusPx: Math.max(size.width, size.height) / 2,
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combo.nodes]);

  const physicsMode: ComboPhysicsMode = !motionOn || prefersReducedMotion ? "off" : editMode ? "kick" : "live";
  const { reshake } = usePartComboPhysics({
    containerRef,
    anchorPx,
    nodes: physicsNodes,
    getNodeEl: (uid) => nodeElsRef.current.get(uid) ?? null,
    mode: physicsMode,
  });

  // Open child-point "add here" markers: the hoop's slot if nothing uses it yet,
  // plus any placed node's own child points not yet occupied.
  const openSlots: { parentUid: string | null; slot: ChildAttachmentPoint; worldGuess: { x: number; y: number } }[] = [];
  if (showHoop && hoopSlot && !combo.nodes.some((n) => n.parentUid === null)) {
    if (anchorPx) openSlots.push({ parentUid: null, slot: hoopSlot, worldGuess: anchorPx });
  }
  for (const node of combo.nodes) {
    const part = getPart(node.partId);
    const slots = part?.attachment?.childAttachmentPoints ?? [];
    for (const slot of slots) {
      const occupied = combo.nodes.some((n) => n.parentUid === node.uid && n.parentChildPointId === slot.id);
      if (!occupied) {
        openSlots.push({ parentUid: node.uid, slot, worldGuess: anchorPx ?? { x: 180, y: 200 } });
      }
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-stone" style={{ height: CANVAS_HEIGHT }}>
      <div
        ref={containerRef}
        className="relative h-full w-full origin-top transition-transform"
        style={{ transform: `scale(${zoom})` }}
        onClick={() => onSelect(null)}
      >
        {showHoop && hoopPart && (
          <div
            className="absolute"
            style={{
              left: hoopCenter.x - hoopSize.width / 2,
              top: hoopCenter.y - hoopSize.height / 2,
              width: hoopSize.width,
              height: hoopSize.height,
            }}
          >
            <div className="relative h-full w-full overflow-hidden">
              <img
                src={hoopPart.imageUrl}
                alt={hoopPart.name}
                draggable={false}
                style={cropStyle(hoopPart, hoopSize.width, hoopSize.height)}
              />
            </div>
          </div>
        )}

        {combo.nodes.map((node) => {
          const part = getPart(node.partId);
          if (!part) return null;
          const displayWidth = DISPLAY_WIDTH_BY_CATEGORY[part.category] ?? 50;
          return (
            <PartNodeView
              key={node.uid}
              ref={(el) => {
                if (el) nodeElsRef.current.set(node.uid, el);
                else nodeElsRef.current.delete(node.uid);
              }}
              part={part}
              displayWidth={displayWidth}
              selected={selectedUid === node.uid}
              editable={editMode}
              onSelect={() => onSelect(node.uid)}
              onDelete={() => onDelete(node.uid)}
            />
          );
        })}

        {editMode &&
          openSlots.map(({ parentUid, slot, worldGuess }) => (
            <button
              key={`${parentUid ?? "hoop"}-${slot.id}`}
              type="button"
              aria-label="Add a part here"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSlotPicker(parentUid, slot);
              }}
              className={cn(
                "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center",
                "rounded-full border-2 border-dashed border-champagne bg-white/90 text-champagne hover:bg-champagne hover:text-white",
              )}
              style={{ left: worldGuess.x, top: worldGuess.y + 10 }}
            >
              <Plus size={14} />
            </button>
          ))}
      </div>

      {!editMode && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            type="button"
            aria-label="Shake again"
            onClick={reshake}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-graphite text-ivory shadow"
          >
            <RotateCw size={15} />
          </button>
        </div>
      )}
      {!motionOn && !editMode && (
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] text-graphite-soft">
          <PauseCircle size={12} /> Motion off
        </div>
      )}
    </div>
  );
}

export function ZoomControls({ zoom, onZoomIn, onZoomOut }: { zoom: number; onZoomIn: () => void; onZoomOut: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label="Zoom out" onClick={onZoomOut} className="rounded-full p-1.5 text-graphite-soft hover:bg-stone">
        <ZoomOut size={16} />
      </button>
      <span className="w-10 text-center text-xs text-graphite-soft">{Math.round(zoom * 100)}%</span>
      <button type="button" aria-label="Zoom in" onClick={onZoomIn} className="rounded-full p-1.5 text-graphite-soft hover:bg-stone">
        <ZoomIn size={16} />
      </button>
    </div>
  );
}
