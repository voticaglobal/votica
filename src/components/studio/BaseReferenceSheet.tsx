import { Check, X } from "lucide-react";
import { useDesign } from "../../context/DesignContext";
import { getPart } from "../../data/parts";
import { BASE_FINDINGS } from "../../data/parts";
import { trackEvent } from "../../services/analytics";
import { cn } from "../../lib/utils";

/**
 * Lets a customer point at a real finding photo as "what I actually want this to
 * look like." It's saved on the design and shown to the ops team in Design Detail,
 * but it does NOT change the hoop preview's geometry — that's still the single
 * shared SVG hoop. Treat this as a note for manufacturing, not a live preview swap.
 */
export function BaseReferenceSheet() {
  const { currentDesign, setBaseReference } = useDesign();
  const current = currentDesign.baseReferencePartId ? getPart(currentDesign.baseReferencePartId) : undefined;

  return (
    <div>
      <p className="mb-4 text-xs leading-relaxed text-graphite-soft">
        Point us to a real finding you like — it's saved as a reference for our team, not a live
        preview swap. The hoop above keeps its own shape.
      </p>

      {current && (
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-stone px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={current.imageUrl} alt={current.name} className="h-10 w-10 object-contain" />
            <span className="text-sm font-medium text-graphite">{current.id} selected</span>
          </div>
          <button
            type="button"
            aria-label="Clear base reference"
            onClick={() => setBaseReference(null)}
            className="rounded-full p-1.5 text-graphite-soft hover:bg-white"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="grid max-h-80 grid-cols-4 gap-3 overflow-y-auto sm:grid-cols-6">
        {BASE_FINDINGS.map((part) => {
          const active = currentDesign.baseReferencePartId === part.id;
          return (
            <button
              key={part.id}
              type="button"
              onClick={() => {
                setBaseReference(part.id);
                trackEvent("base_selected", { baseId: part.id });
              }}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl border bg-white p-2 text-center transition",
                active ? "border-champagne" : "border-graphite/10 hover:border-champagne/60",
              )}
            >
              {active && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-champagne text-graphite">
                  <Check size={10} />
                </span>
              )}
              <img src={part.imageUrl} alt={part.name} className="h-10 w-10 object-contain" />
              <span className="text-[10px] text-graphite-soft">{part.id}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
