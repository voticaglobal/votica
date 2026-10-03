import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { Chip } from "../common/Chip";
import { Button } from "../common/Button";
import { Textarea, Input, FieldGroup } from "../common/Field";
import { getManufacturingProfile } from "../../services/manufacturingProfile";
import { fileToDataUrl } from "../../lib/image";
import { cn } from "../../lib/utils";
import type { CharmBriefInput, CharmStyle, CharmTheme, RepresentationMode } from "../../types/charmStudio";
import type { MaterialType } from "../../types/jewelry";

const THEMES: { value: CharmTheme; label: string }[] = [
  { value: "pet", label: "Pet" },
  { value: "initial", label: "Initial" },
  { value: "memory", label: "Memory" },
  { value: "symbol", label: "Symbol" },
  { value: "original", label: "Original Design" },
];

const STYLES: { value: CharmStyle; label: string }[] = [
  { value: "minimal", label: "Minimal" },
  { value: "cute", label: "Cute" },
  { value: "elegant", label: "Elegant" },
];

const REPRESENTATIONS: { value: RepresentationMode; label: string; blurb: string }[] = [
  { value: "flat_silhouette", label: "Flat silhouette", blurb: "A clean cut-out shape, one flat layer." },
  { value: "engraved_plate", label: "Engraved plate", blurb: "A flat plate with a line design etched into it." },
  { value: "relief_concept", label: "Relief concept", blurb: "Dimensional, sculpted detail — concept only, needs manufacturing review." },
];

const FINISHES: { value: MaterialType; label: string; swatch: string }[] = [
  { value: "silver", label: "Silver", swatch: "linear-gradient(135deg,#f4f5f6,#9ea3aa)" },
  { value: "gold-vermeil", label: "Gold Vermeil", swatch: "linear-gradient(135deg,#f3e1b5,#a97f3c)" },
  { value: "rose-gold", label: "Rose Gold", swatch: "linear-gradient(135deg,#f1d3c8,#b97e6c)" },
];

function RepresentationIcon({ mode }: { mode: RepresentationMode }) {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9">
      {mode === "flat_silhouette" && <path d="M20 4 L32 14 L28 34 L12 34 L8 14 Z" fill="#c9a86a" />}
      {mode === "engraved_plate" && (
        <>
          <rect x="7" y="7" width="26" height="26" rx="4" fill="#e4d3ab" />
          <path d="M13 20 Q20 12 27 20 Q20 28 13 20 Z" fill="none" stroke="#2b2926" strokeWidth="1.3" />
        </>
      )}
      {mode === "relief_concept" && (
        <circle cx="20" cy="20" r="13" fill="url(#relief-grad)" />
      )}
      <defs>
        <radialGradient id="relief-grad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f3e1b5" />
          <stop offset="100%" stopColor="#a97f3c" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function CharmBriefForm({
  value,
  onChange,
  onSubmit,
}: {
  value: CharmBriefInput;
  onChange: (next: CharmBriefInput) => void;
  onSubmit: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sizePresets = getManufacturingProfile().sizePresets ?? [];

  const set = <K extends keyof CharmBriefInput>(key: K, v: CharmBriefInput[K]) =>
    onChange({ ...value, [key]: v });

  const handleFile = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    set("sourceImage", dataUrl);
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">
          A photo or sketch (optional)
        </h2>
        <p className="mb-3 text-xs text-graphite-soft">
          Used only to shape your charm's concept art — it isn't published or shared.
        </p>
        {value.sourceImage ? (
          <div className="relative h-40 w-40 overflow-hidden rounded-2xl">
            <img src={value.sourceImage} alt="Uploaded reference" className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => set("sourceImage", undefined)}
              className="absolute right-2 top-2 rounded-full bg-graphite/80 p-1.5 text-ivory"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-32 w-full max-w-xs flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-graphite/20 bg-stone text-graphite-soft hover:border-champagne"
          >
            <Upload size={20} />
            <span className="text-sm">Add a photo or sketch</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">
          Describe what you want
        </h2>
        <Textarea
          rows={3}
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="My dog's silhouette, ears up, looking to the side..."
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">Theme</h2>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <Chip key={t.value} active={value.theme === t.value} onClick={() => set("theme", t.value)}>
              {t.label}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">Style</h2>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <Chip key={s.value} active={value.style === s.value} onClick={() => set("style", s.value)}>
              {s.label}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">
          How should it be made?
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {REPRESENTATIONS.map((r) => {
            const active = value.representation === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => set("representation", r.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition",
                  active ? "border-graphite bg-stone" : "border-graphite/10 hover:border-graphite/30",
                )}
              >
                <RepresentationIcon mode={r.value} />
                <span className="text-xs font-medium text-graphite">{r.label}</span>
                <span className="text-[11px] leading-snug text-graphite-soft">{r.blurb}</span>
              </button>
            );
          })}
        </div>
        {value.representation === "relief_concept" && (
          <p className="mt-2 text-xs text-champagne">
            Dimensional pieces always go through manufacturing review before production.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">Finish color</h2>
        <div className="flex gap-3">
          {FINISHES.map((f) => {
            const active = value.finishColor === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => set("finishColor", f.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2 transition",
                  active ? "border-graphite" : "border-graphite/10 hover:border-graphite/30",
                )}
              >
                <span className="h-7 w-7 rounded-full" style={{ background: f.swatch }} />
                <span className="text-[11px] text-graphite-soft">{f.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">Size</h2>
        <div className="flex flex-wrap gap-2">
          {sizePresets.map((s) => (
            <Chip
              key={s.id}
              active={value.sizePresetId === s.id}
              onClick={() => set("sizePresetId", s.id)}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <FieldGroup label="Initial or short engraving (optional)" htmlFor="initial">
          <Input
            id="initial"
            maxLength={3}
            value={value.initialText ?? ""}
            onChange={(e) => set("initialText", e.target.value)}
            placeholder="A"
          />
        </FieldGroup>
      </section>

      <Button size="lg" className="w-full sm:w-auto" onClick={onSubmit} disabled={!value.description && !value.sourceImage}>
        Generate Charm Concepts
      </Button>
    </div>
  );
}
