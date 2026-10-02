import { useRef, useState } from "react";
import { Upload, RotateCcw, Plus, Trash2 } from "lucide-react";
import { Container } from "../components/common/Container";
import { Button } from "../components/common/Button";
import { Chip } from "../components/common/Chip";
import { BottomSheet } from "../components/common/BottomSheet";
import { EarringCanvas } from "../components/tryon/EarringCanvas";
import { DEFAULT_EAR_PHOTOS, EARRING_OPTIONS, MAX_ACCESSORIES } from "../data/tryon";
import { fileToDataUrl, hasAlphaTransparency, cutoutBackground } from "../lib/image";
import { trackEvent } from "../services/analytics";
import { generateId } from "../lib/utils";
import type { EarringOption, PlacedAccessory } from "../types/tryon";

export function TryOn() {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const earringInputRef = useRef<HTMLInputElement>(null);

  const [photoUrl, setPhotoUrl] = useState(DEFAULT_EAR_PHOTOS[0].image);
  const [customOptions, setCustomOptions] = useState<EarringOption[]>([]);
  const [placed, setPlaced] = useState<PlacedAccessory[]>([]);
  const [pendingOption, setPendingOption] = useState<EarringOption | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const options = [...EARRING_OPTIONS, ...customOptions];
  const atLimit = placed.length >= MAX_ACCESSORIES;

  const resetAll = () => {
    setPlaced([]);
    setPendingOption(null);
    setSelectedId(null);
  };

  const handlePhotoUpload = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    setPhotoUrl(dataUrl);
    resetAll();
    trackEvent("photo_uploaded", { context: "try_on_ear" });
  };

  const handleEarringUpload = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    const alreadyCut = await hasAlphaTransparency(dataUrl);
    const finalImage = alreadyCut ? dataUrl : await cutoutBackground(dataUrl).catch(() => dataUrl);
    const option: EarringOption = {
      id: generateId("acc"),
      label: "Your upload",
      image: finalImage,
      displayWidth: 64,
      chainLength: 12,
    };
    setCustomOptions((prev) => [...prev, option]);
    setPendingOption(option);
    setPickerOpen(false);
    trackEvent("photo_uploaded", { context: "try_on_earring" });
  };

  const handlePlace = (pos: { x: number; y: number }) => {
    if (!pendingOption || placed.length >= MAX_ACCESSORIES) return;
    const next: PlacedAccessory = { id: generateId("placed"), option: pendingOption, anchorPx: pos };
    setPlaced((prev) => [...prev, next]);
    setPendingOption(null);
    setSelectedId(next.id);
    trackEvent("charm_added", { context: "try_on", type: pendingOption.id });
  };

  const handleDelete = (id: string) => {
    setPlaced((prev) => prev.filter((p) => p.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
    trackEvent("charm_deleted", { context: "try_on" });
  };

  return (
    <Container className="py-10 pb-24 sm:py-16">
      <div className="mb-8 max-w-xl">
        <h1 className="text-3xl font-medium text-graphite sm:text-4xl">Try it on.</h1>
        <p className="mt-3 text-graphite-soft">
          Add earrings to a photo of your ear and see them hang and swing the way they actually would.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <EarringCanvas
            photoUrl={photoUrl}
            placed={placed}
            pendingOption={pendingOption}
            selectedId={selectedId}
            onPlace={handlePlace}
            onSelect={setSelectedId}
            onDelete={handleDelete}
          />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-graphite-soft">{placed.length}/{MAX_ACCESSORIES} placed</span>
            {selectedId && (
              <Button size="sm" variant="outline" onClick={() => handleDelete(selectedId)}>
                <Trash2 size={15} />
                Remove Selected
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => photoInputRef.current?.click()}>
              <Upload size={15} />
              Use My Photo
            </Button>
            <Button size="sm" variant="outline" onClick={resetAll}>
              <RotateCcw size={15} />
              Clear All
            </Button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
              }}
            />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">Earrings</h2>
          <Button
            className="w-full sm:w-auto"
            onClick={() => setPickerOpen(true)}
            disabled={atLimit}
          >
            <Plus size={16} />
            Add Accessory
          </Button>
          {atLimit && (
            <p className="mt-2 text-xs text-graphite-soft">
              You've added {MAX_ACCESSORIES} — remove one to add another.
            </p>
          )}

          <div className="mt-6 space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite-soft">Sample photos</h2>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_EAR_PHOTOS.map((p) => (
                <Chip
                  key={p.id}
                  active={photoUrl === p.image}
                  onClick={() => {
                    setPhotoUrl(p.image);
                    resetAll();
                  }}
                >
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-graphite-soft">
            Pick an earring, then tap the photo to pin it — it hangs with real gravity. Drag any
            placed earring and let go to see it swing. Tap one to select it, then remove it.
          </p>
        </div>
      </div>

      <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add an earring">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                setPendingOption(o);
                setPickerOpen(false);
              }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-graphite/10 bg-white p-4 text-center transition hover:border-champagne"
            >
              <img src={o.image} alt={o.label} className="h-12 w-12 object-contain" />
              <span className="text-xs font-medium text-graphite">{o.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => earringInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-graphite/20 bg-stone p-4 text-center text-graphite-soft hover:border-champagne"
          >
            <Upload size={18} />
            <span className="text-xs font-medium">Upload your own</span>
          </button>
          <input
            ref={earringInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleEarringUpload(file);
            }}
          />
        </div>
      </BottomSheet>
    </Container>
  );
}
