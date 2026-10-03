import { Button } from "../common/Button";
import type { CharmConcept } from "../../types/charmStudio";

export function ConceptOptionCard({
  concept,
  onChoose,
}: {
  concept: CharmConcept;
  onChoose: () => void;
}) {
  return (
    <div className="flex flex-col rounded-3xl border border-graphite/8 bg-white p-5">
      <div className="mb-4 flex aspect-square items-center justify-center rounded-2xl bg-stone p-6">
        {concept.imageUrl ? (
          <img src={concept.imageUrl} alt={concept.name} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-graphite-soft">
            <svg viewBox="-12 -12 24 24" className="h-16 w-16">
              <circle r="9" fill="#e4d3ab" stroke="#c9a86a" strokeWidth="1" />
            </svg>
            <span className="text-xs">Demo concept — no image generated</span>
          </div>
        )}
      </div>

      <h3 className="font-serif text-lg text-graphite">{concept.name}</h3>
      {concept.isDemo && (
        <span className="mt-1 inline-block w-fit rounded-full bg-stone px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-graphite-soft">
          Demo — not a real generation
        </span>
      )}
      <p className="mt-2 text-sm leading-relaxed text-graphite-soft">{concept.designIntent}</p>

      <p className="mt-3 text-xs leading-relaxed text-graphite-soft">
        <span className="font-medium text-graphite">Connection: </span>
        {concept.connectionDescription}
      </p>

      {concept.needsReview.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {concept.needsReview.map((item) => (
            <span
              key={item}
              className="rounded-full bg-champagne-light/50 px-2 py-0.5 text-[10px] font-medium text-graphite-soft"
            >
              {item}
            </span>
          ))}
        </div>
      )}

      <Button className="mt-5 w-full" onClick={onChoose}>
        Choose This Concept
      </Button>
    </div>
  );
}
