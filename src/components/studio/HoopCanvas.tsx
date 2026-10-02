import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useDesign } from "../../context/DesignContext";
import { HOOP_ATTACHMENT_POINTS, findNearestAttachmentPoint, getFreeAttachmentPoints } from "../../data/attachmentPoints";
import { MaterialDefs } from "../../data/charms";
import { HoopShape } from "./HoopShape";
import { CharmNode } from "./CharmNode";
import { useSvgPoint } from "../../hooks/useSvgPoint";
import { trackEvent } from "../../services/analytics";
import { vibrate } from "../../lib/haptics";
import { cn } from "../../lib/utils";

export function HoopCanvas({
  selectedCharmId,
  onSelectCharm,
  className,
}: {
  selectedCharmId: string | null;
  onSelectCharm: (id: string | null) => void;
  className?: string;
}) {
  const { currentDesign, moveCharm, nudgeCharm, deleteCharm } = useDesign();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const toSvgPoint = useSvgPoint(svgRef);

  const [draggingCharmId, setDraggingCharmId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [snapTargetId, setSnapTargetId] = useState<string | null>(null);

  const handlePointerDown = useCallback(
    (charmId: string) => (e: ReactPointerEvent<SVGGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      onSelectCharm(charmId);
      setDraggingCharmId(charmId);
      setDragPos(toSvgPoint(e.clientX, e.clientY));
      setSnapTargetId(null);
      vibrate(10);
    },
    [onSelectCharm, toSvgPoint],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!draggingCharmId) return;
      const point = toSvgPoint(e.clientX, e.clientY);
      setDragPos(point);
      // Only snap onto points that are free (or the charm's own point) — otherwise two
      // charms can end up sharing an attachment point and render stacked forever.
      const availablePoints = getFreeAttachmentPoints(currentDesign.charms, draggingCharmId);
      const nearestId = findNearestAttachmentPoint(point.x, point.y, availablePoints).id;
      setSnapTargetId((prev) => {
        if (prev !== nearestId) vibrate(8);
        return nearestId;
      });
    },
    [draggingCharmId, toSvgPoint, currentDesign.charms],
  );

  const handlePointerUp = useCallback(() => {
    if (draggingCharmId && snapTargetId) {
      moveCharm(draggingCharmId, snapTargetId);
      trackEvent("charm_moved", { charmId: draggingCharmId, attachmentPointId: snapTargetId });
      vibrate(15);
    }
    setDraggingCharmId(null);
    setDragPos(null);
    setSnapTargetId(null);
  }, [draggingCharmId, snapTargetId, moveCharm]);

  const handleKeyMove = useCallback(
    (charmId: string, direction: -1 | 1) => {
      nudgeCharm(charmId, direction);
      trackEvent("charm_moved", { charmId, via: "keyboard" });
    },
    [nudgeCharm],
  );

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 220"
      className={cn("h-full w-full select-none touch-none", className)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerDown={(e) => {
        if (e.target === svgRef.current) onSelectCharm(null);
      }}
    >
      <MaterialDefs />
      <HoopShape material={currentDesign.material} />

      {HOOP_ATTACHMENT_POINTS.map((point) => {
        const isTarget = draggingCharmId !== null && point.id === snapTargetId;
        return (
          <circle
            key={point.id}
            cx={point.x}
            cy={point.y}
            r={isTarget ? 5.5 : 1.75}
            fill={isTarget ? "#c9a86a" : "rgba(43,41,38,0.14)"}
          />
        );
      })}

      {currentDesign.charms.map((charm) => {
        const isDragging = charm.id === draggingCharmId;
        const point = HOOP_ATTACHMENT_POINTS.find((p) => p.id === charm.attachmentPointId);
        if (!point) return null;
        const position = isDragging && dragPos ? dragPos : point;
        return (
          <CharmNode
            key={charm.id}
            charm={charm}
            x={position.x}
            y={position.y}
            selected={charm.id === selectedCharmId}
            dragging={isDragging}
            onPointerDown={handlePointerDown(charm.id)}
            onSelect={() => onSelectCharm(charm.id)}
            onMove={(direction) => handleKeyMove(charm.id, direction)}
            onDelete={() => {
              deleteCharm(charm.id);
              trackEvent("charm_deleted", { charmId: charm.id, type: charm.type, via: "keyboard" });
              onSelectCharm(null);
            }}
          />
        );
      })}
    </svg>
  );
}
