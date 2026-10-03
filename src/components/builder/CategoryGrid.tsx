import { BUILDER_CATEGORIES } from "../../data/builder";

export function CategoryGrid({ onSelect }: { onSelect: (categoryId: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-5">
      {BUILDER_CATEGORIES.map((c) => (
        <button
          key={c.id}
          type="button"
          disabled={c.comingSoon}
          onClick={() => onSelect(c.id)}
          className="relative flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl bg-stone text-graphite disabled:opacity-40"
        >
          <span className="text-sm font-medium">{c.label}</span>
          {c.comingSoon && <span className="text-xs text-graphite-soft">Coming soon</span>}
        </button>
      ))}
    </div>
  );
}
