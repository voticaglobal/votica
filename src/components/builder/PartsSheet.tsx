import { useState } from "react";
import { Check } from "lucide-react";
import { BottomSheet } from "../common/BottomSheet";
import { Chip } from "../common/Chip";
import { PartShape } from "./PartShape";
import { BUILDER_PARTS, PART_CATEGORY_TABS } from "../../data/builder";
import type { BuildItem, PartCategory } from "../../types/builder";
import { formatCurrency } from "../../lib/utils";

export function PartsSheet({
  open,
  onClose,
  placedPartIds,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  placedPartIds: Set<string>;
  onAdd: (item: BuildItem) => void;
}) {
  const [tab, setTab] = useState<PartCategory | "all">("all");

  const parts = tab === "all" ? BUILDER_PARTS : BUILDER_PARTS.filter((p) => p.category === tab);

  return (
    <BottomSheet open={open} onClose={onClose} title="Add a part">
      <div className="mb-4 flex flex-wrap gap-2">
        {PART_CATEGORY_TABS.map((t) => (
          <Chip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {parts.map((p) => {
          const added = placedPartIds.has(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onAdd(p)}
              className="relative flex flex-col items-center gap-2 rounded-2xl border border-graphite/10 bg-white p-4 text-center transition hover:border-champagne"
            >
              {added && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-champagne text-graphite">
                  <Check size={12} />
                </span>
              )}
              <div className="flex h-12 w-12 items-center justify-center">
                <PartShape item={p} />
              </div>
              <span className="text-xs font-medium text-graphite">{p.label}</span>
              <span className="text-xs text-graphite-soft">{formatCurrency(p.price)}</span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
