import { useState } from "react";
import { BottomSheet } from "../common/BottomSheet";
import { Button } from "../common/Button";
import { PartShape } from "./PartShape";
import { BUILDER_BASES } from "../../data/builder";
import type { BuildItem } from "../../types/builder";
import { formatCurrency } from "../../lib/utils";

export function BaseGrid({ onConfirm }: { onConfirm: (base: BuildItem) => void }) {
  const [detail, setDetail] = useState<BuildItem | null>(null);

  return (
    <div className="p-5">
      <div className="grid grid-cols-2 gap-4">
        {BUILDER_BASES.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setDetail(b)}
            className="flex flex-col items-center gap-2 rounded-2xl bg-stone p-6"
          >
            <div className="flex h-16 w-16 items-center justify-center">
              <PartShape item={b} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-graphite">Pick Up</span>
            <span className="text-sm text-graphite-soft">{formatCurrency(b.price)}</span>
          </button>
        ))}
      </div>

      <BottomSheet open={!!detail} onClose={() => setDetail(null)} title={detail?.label}>
        {detail && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-stone">
              <PartShape item={detail} />
            </div>
            <p className="text-sm text-graphite-soft">
              Piercing and earring are designed to be symmetric.
            </p>
            <p className="text-lg font-medium text-graphite">{formatCurrency(detail.price)}</p>
            <Button
              className="w-full"
              onClick={() => {
                onConfirm(detail);
                setDetail(null);
              }}
            >
              Confirm your base
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
