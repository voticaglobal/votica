import { Button } from "../common/Button";
import { HoopPreview } from "../studio/HoopPreview";
import { formatCurrency } from "../../lib/utils";
import type { JewelryDesign } from "../../types/jewelry";

export function ProductCard({
  name,
  price,
  design,
  onCustomize,
  onBuy,
}: {
  name: string;
  price: number;
  design?: JewelryDesign;
  onCustomize: () => void;
  onBuy: () => void;
}) {
  return (
    <div className="flex flex-col rounded-3xl border border-graphite/8 bg-white p-5">
      <div className="mb-4 aspect-square rounded-2xl bg-stone p-6">
        {design ? (
          <HoopPreview design={design} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-graphite-soft">
            Preview unavailable
          </div>
        )}
      </div>
      <h3 className="font-serif text-lg text-graphite">{name}</h3>
      <p className="mt-1 text-sm font-medium text-graphite-soft">{formatCurrency(price)}</p>
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={onCustomize}>
          Customize
        </Button>
        <Button size="sm" className="flex-1" onClick={onBuy}>
          Buy
        </Button>
      </div>
    </div>
  );
}
