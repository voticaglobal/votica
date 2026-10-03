import { BottomSheet } from "../common/BottomSheet";
import { getAttachableParts } from "../../data/parts";
import type { ChildAttachmentPoint, PartCategory } from "../../types/catalog";

export function ComboPartPicker({
  open,
  onClose,
  slot,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  slot: ChildAttachmentPoint | null;
  onChoose: (partId: string) => void;
}) {
  const accepted: PartCategory[] = slot?.acceptsCategories ?? ["connecting", "charm", "decoration"];
  const options = accepted.flatMap((c) => getAttachableParts(c));

  return (
    <BottomSheet open={open} onClose={onClose} title="Add a part">
      <p className="mb-4 text-xs text-graphite-soft">
        Only parts with a calibrated connection point are offered here — the rest of the 304-photo
        catalog still needs the attachment-point editor before it can hang with real physics.
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {options.map((part) => (
          <button
            key={part.id}
            type="button"
            onClick={() => onChoose(part.id)}
            className="flex flex-col items-center gap-1 rounded-xl border border-graphite/10 bg-white p-3 text-center transition hover:border-champagne"
          >
            <img src={part.imageUrl} alt={part.name} className="h-10 w-10 object-contain" />
            <span className="text-[10px] text-graphite-soft">{part.id}</span>
          </button>
        ))}
        {options.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-graphite-soft">
            No calibrated parts for this slot yet.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
