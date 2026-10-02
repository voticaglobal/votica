import { Check } from "lucide-react";
import { useDesign } from "../../context/DesignContext";
import { trackEvent } from "../../services/analytics";
import type { MaterialType } from "../../types/jewelry";
import { cn } from "../../lib/utils";

const MATERIALS: { type: MaterialType; label: string; swatch: string }[] = [
  { type: "silver", label: "925 Silver", swatch: "linear-gradient(135deg,#f4f5f6,#9ea3aa)" },
  { type: "gold-vermeil", label: "Gold Vermeil", swatch: "linear-gradient(135deg,#f3e1b5,#a97f3c)" },
  { type: "rose-gold", label: "Rose Gold", swatch: "linear-gradient(135deg,#f1d3c8,#b97e6c)" },
];

export function MaterialPicker() {
  const { currentDesign, setMaterial } = useDesign();

  return (
    <div>
      <p className="mb-4 text-xs text-graphite-soft">
        Your charms automatically match the hoop's metal — everything stays coordinated.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {MATERIALS.map((m) => {
        const active = currentDesign.material === m.type;
        return (
          <button
            key={m.type}
            type="button"
            onClick={() => {
              setMaterial(m.type);
              trackEvent("material_changed", { material: m.type });
            }}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border p-4 transition",
              active ? "border-graphite" : "border-graphite/10 hover:border-graphite/30",
            )}
          >
            <span
              className="relative flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: m.swatch }}
            >
              {active && <Check size={16} className="text-graphite drop-shadow" />}
            </span>
            <span className="text-xs font-medium text-graphite">{m.label}</span>
          </button>
        );
        })}
      </div>
    </div>
  );
}
