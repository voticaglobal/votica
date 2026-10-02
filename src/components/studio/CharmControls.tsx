import { useState } from "react";
import { Trash2, Copy, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useDesign } from "../../context/DesignContext";
import { MAX_CHARM_SCALE, MIN_CHARM_SCALE } from "../../services/manufacturing";
import { trackEvent } from "../../services/analytics";
import { vibrate } from "../../lib/haptics";
import type { CharmInstance } from "../../types/jewelry";

export function CharmControls({
  charm,
  onDeselect,
}: {
  charm: CharmInstance;
  onDeselect: () => void;
}) {
  const { updateCharm, deleteCharm, duplicateCharm, nudgeCharm } = useDesign();
  const [message, setMessage] = useState<string | null>(null);

  const handleDelete = () => {
    deleteCharm(charm.id);
    trackEvent("charm_deleted", { charmId: charm.id, type: charm.type });
    onDeselect();
  };

  const handleDuplicate = () => {
    const result = duplicateCharm(charm.id);
    if (result.ok) {
      trackEvent("charm_added", { type: charm.type, via: "duplicate" });
    } else {
      setMessage(result.message ?? null);
    }
  };

  const handleNudge = (direction: -1 | 1) => {
    nudgeCharm(charm.id, direction);
    trackEvent("charm_moved", { charmId: charm.id, via: "nudge-button" });
    vibrate(10);
  };

  return (
    <div className="space-y-2">
      {message && (
        <p className="rounded-xl bg-stone px-4 py-2 text-xs text-graphite-soft">{message}</p>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-graphite/10 bg-white px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-graphite-soft">Position</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleNudge(-1)}
            className="rounded-full p-2 text-graphite-soft hover:bg-stone"
            aria-label="Move charm left along the hoop"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => handleNudge(1)}
            className="rounded-full p-2 text-graphite-soft hover:bg-stone"
            aria-label="Move charm right along the hoop"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-graphite/10 bg-white px-4 py-3">
        <div className="flex flex-1 items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-graphite-soft">Size</span>
          <input
            type="range"
            min={MIN_CHARM_SCALE}
            max={MAX_CHARM_SCALE}
            step={0.05}
            value={charm.scale}
            onChange={(e) => updateCharm(charm.id, { scale: Number(e.target.value) })}
            className="h-1.5 flex-1 accent-champagne"
            aria-label="Charm size"
          />
        </div>
        <button
          type="button"
          onClick={() => updateCharm(charm.id, { rotation: (charm.rotation + 15) % 360 })}
          className="rounded-full p-2 text-graphite-soft hover:bg-stone"
          aria-label="Rotate charm"
        >
          <RotateCw size={18} />
        </button>
        <button
          type="button"
          onClick={handleDuplicate}
          className="hidden rounded-full p-2 text-graphite-soft hover:bg-stone sm:inline-flex"
          aria-label="Duplicate charm"
        >
          <Copy size={18} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-full p-2 text-graphite-soft hover:bg-red-50 hover:text-red-500"
          aria-label="Delete charm"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
