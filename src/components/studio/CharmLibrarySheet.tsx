import { useState } from "react";
import { BottomSheet } from "../common/BottomSheet";
import { Button } from "../common/Button";
import { Chip } from "../common/Chip";
import { Input } from "../common/Field";
import { CHARM_LIBRARY, CharmShape } from "../../data/charms";
import { REAL_CHARM_PARTS } from "../../data/parts";
import { useDesign } from "../../context/DesignContext";
import { canAddCharm } from "../../services/manufacturing";
import { trackEvent } from "../../services/analytics";
import type { CharmType } from "../../types/jewelry";

export function CharmLibrarySheet({
  open,
  onClose,
  onOpenAiCharm,
}: {
  open: boolean;
  onClose: () => void;
  onOpenAiCharm: () => void;
}) {
  const { currentDesign, addCharm } = useDesign();
  const [tab, setTab] = useState<"classic" | "real">("classic");
  const [pendingInitial, setPendingInitial] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const atLimit = !canAddCharm(currentDesign);

  const handleSelect = (type: CharmType) => {
    if (type === "custom") {
      onOpenAiCharm();
      onClose();
      return;
    }
    if (type === "initial") return; // handled by inline form below

    const result = addCharm(type);
    if (result.ok) {
      trackEvent("charm_added", { type });
      onClose();
    } else {
      setMessage(result.message ?? null);
    }
  };

  const handleSelectPart = (partId: string) => {
    const result = addCharm("part", { partId });
    if (result.ok) {
      trackEvent("part_added", { partId });
      onClose();
    } else {
      setMessage(result.message ?? null);
    }
  };

  const handleAddInitial = () => {
    const result = addCharm("initial", { text: pendingInitial || "A" });
    if (result.ok) {
      trackEvent("charm_added", { type: "initial", text: pendingInitial });
      setPendingInitial("");
      onClose();
    } else {
      setMessage(result.message ?? null);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Add a charm">
      {atLimit && (
        <p className="mb-4 rounded-xl bg-stone px-4 py-3 text-sm text-graphite-soft">
          You've reached 5 charms — the most we can craft beautifully on one hoop.
        </p>
      )}
      {message && !atLimit && (
        <p className="mb-4 rounded-xl bg-stone px-4 py-3 text-sm text-graphite-soft">{message}</p>
      )}

      <div className="mb-4 flex gap-2">
        <Chip active={tab === "classic"} onClick={() => setTab("classic")}>
          Classic
        </Chip>
        <Chip active={tab === "real"} onClick={() => setTab("real")}>
          Real Parts ({REAL_CHARM_PARTS.length})
        </Chip>
      </div>

      {tab === "classic" && (
        <>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {CHARM_LIBRARY.map((item) => (
              <button
                key={item.type}
                type="button"
                disabled={atLimit}
                onClick={() => handleSelect(item.type)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-graphite/10 bg-white p-4 text-center transition hover:border-champagne disabled:opacity-40 disabled:pointer-events-none"
              >
                <svg viewBox="-14 -14 28 28" className="h-10 w-10">
                  <CharmShape type={item.type} material="silver" text="A" />
                </svg>
                <span className="text-xs font-medium text-graphite">{item.label}</span>
              </button>
            ))}
          </div>

          {!atLimit && (
            <div className="mt-5 flex items-end gap-3 rounded-2xl bg-stone p-4">
              <div className="flex-1">
                <label htmlFor="initial-text" className="mb-1 block text-xs font-medium text-graphite-soft">
                  Initial charm text (1–2 letters)
                </label>
                <Input
                  id="initial-text"
                  maxLength={2}
                  value={pendingInitial}
                  onChange={(e) => setPendingInitial(e.target.value.replace(/[^a-zA-Z]/g, ""))}
                  placeholder="L"
                />
              </div>
              <Button size="sm" onClick={handleAddInitial}>
                Add
              </Button>
            </div>
          )}
        </>
      )}

      {tab === "real" && (
        <>
          <p className="mb-4 rounded-xl bg-stone px-4 py-3 text-xs leading-relaxed text-graphite-soft">
            Photographed from our real parts archive. Category is a demo classification (manual review
            for bases, an automated shape check for the rest) — not a confirmed manufacturing
            compatibility.
          </p>
          <div className="grid max-h-80 grid-cols-4 gap-3 overflow-y-auto sm:grid-cols-6">
            {REAL_CHARM_PARTS.map((part) => (
              <button
                key={part.id}
                type="button"
                disabled={atLimit}
                onClick={() => handleSelectPart(part.id)}
                className="flex flex-col items-center gap-1 rounded-xl border border-graphite/10 bg-white p-2 text-center transition hover:border-champagne disabled:opacity-40 disabled:pointer-events-none"
              >
                <img src={part.imageUrl} alt={part.name} className="h-10 w-10 object-contain" />
                <span className="text-[10px] text-graphite-soft">{part.id}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </BottomSheet>
  );
}
