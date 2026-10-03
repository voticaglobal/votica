import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Check } from "lucide-react";
import { Button } from "../components/common/Button";
import { CategoryGrid } from "../components/builder/CategoryGrid";
import { BaseGrid } from "../components/builder/BaseGrid";
import { CustomizeCanvas } from "../components/builder/CustomizeCanvas";
import { PartsSheet } from "../components/builder/PartsSheet";
import { PartShape } from "../components/builder/PartShape";
import { BottomSheet } from "../components/common/BottomSheet";
import { trackEvent } from "../services/analytics";
import { generateId, formatCurrency } from "../lib/utils";
import type { BuildItem, PlacedItem } from "../types/builder";

type Step = "category" | "base" | "customize";

const ZOOM_LEVELS = [0.75, 1, 1.5];

export function Builder() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("category");
  const [placed, setPlaced] = useState<PlacedItem[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [partsOpen, setPartsOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [posted, setPosted] = useState(false);

  useEffect(() => {
    trackEvent("builder_opened");
  }, []);

  const total = placed.reduce((sum, p) => sum + p.item.price, 0);
  const placedPartIds = new Set(placed.filter((p) => !p.isBase).map((p) => p.item.id));

  const handleCategorySelect = () => setStep("base");

  const handleBaseConfirm = (base: BuildItem) => {
    setPlaced([{ uid: generateId("placed"), item: base, isBase: true, x: 160, y: 90 }]);
    setStep("customize");
    trackEvent("base_selected", { baseId: base.id });
  };

  const handleAddPart = (item: BuildItem) => {
    const lowestY = placed.length ? Math.max(...placed.map((p) => p.y + p.item.height / 2)) : 60;
    const next: PlacedItem = {
      uid: generateId("placed"),
      item,
      isBase: false,
      x: 160,
      y: lowestY + item.height / 2 + 24,
    };
    setPlaced((prev) => [...prev, next]);
    setSelectedUid(next.uid);
    trackEvent("part_added", { partId: item.id });
  };

  const handleMove = (uid: string, dx: number, dy: number) => {
    setPlaced((prev) => prev.map((p) => (p.uid === uid ? { ...p, x: p.x + dx, y: p.y + dy } : p)));
  };

  const handleDeleteSelected = () => {
    if (!selectedUid) return;
    setPlaced((prev) => prev.filter((p) => p.uid !== selectedUid));
    setSelectedUid(null);
    trackEvent("part_deleted");
  };

  const handleTogglePreview = () => {
    setPreviewMode((v) => !v);
    trackEvent("builder_preview_toggled", { on: !previewMode });
  };

  const handlePostIt = () => {
    setCompleteOpen(false);
    setPosted(true);
    trackEvent("builder_posted", { itemCount: placed.length, total });
  };

  const handleBack = () => {
    if (step === "base") setStep("category");
    else if (step === "customize") {
      setPlaced([]);
      setSelectedUid(null);
      setStep("base");
    } else navigate(-1);
  };

  if (posted) {
    return (
      <BuilderFrame>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <div>
            <h1 className="text-2xl font-medium text-graphite">Congratulations!</h1>
            <p className="mt-1 text-graphite-soft">Your work has been posted.</p>
          </div>
          <AssemblyPreview placed={placed} />
          <div className="flex w-full max-w-xs flex-col gap-3">
            <Button className="w-full" onClick={() => navigate("/")}>Continue</Button>
            <button type="button" className="text-sm text-graphite-soft hover:text-graphite" onClick={() => navigate("/")}>
              Home
            </button>
          </div>
        </div>
      </BuilderFrame>
    );
  }

  return (
    <BuilderFrame>
      <header
        className="flex items-center justify-between border-b border-graphite/10 px-4 py-3"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <button type="button" onClick={handleBack} aria-label="Go back" className="rounded-full p-2 text-graphite-soft hover:bg-stone">
          <ChevronLeft size={20} />
        </button>
        <p className="text-sm font-medium text-graphite">
          {step === "category" && "Select a category"}
          {step === "base" && "Select your base"}
          {step === "customize" && formatCurrency(total)}
        </p>
        {step === "customize" ? (
          <button
            type="button"
            aria-label="Finish design"
            disabled={placed.length === 0}
            onClick={() => setCompleteOpen(true)}
            className="rounded-full p-2 text-graphite hover:bg-stone disabled:opacity-30"
          >
            <Check size={20} />
          </button>
        ) : (
          <span className="w-9" />
        )}
      </header>

      {step !== "customize" && (
        <div className="flex-1 overflow-y-auto">
          {step === "category" && <CategoryGrid onSelect={handleCategorySelect} />}
          {step === "base" && <BaseGrid onConfirm={handleBaseConfirm} />}
        </div>
      )}

      {step === "customize" && (
        <>
          <CustomizeCanvas
            placed={placed}
            selectedUid={selectedUid}
            zoom={ZOOM_LEVELS[zoomIndex]}
            previewMode={previewMode}
            onSelect={setSelectedUid}
            onMove={handleMove}
            onAdd={() => setPartsOpen(true)}
            onDelete={handleDeleteSelected}
            onTogglePreview={handleTogglePreview}
            onCycleZoom={() => setZoomIndex((i) => (i + 1) % ZOOM_LEVELS.length)}
          />
          <div className="border-t border-graphite/10 bg-stone-dark/60 px-4 py-3 text-sm font-medium text-graphite">
            total amount&nbsp;&nbsp;{formatCurrency(total)}
          </div>
          <PartsSheet
            open={partsOpen}
            onClose={() => setPartsOpen(false)}
            placedPartIds={placedPartIds}
            onAdd={handleAddPart}
          />
          <BottomSheet open={completeOpen} onClose={() => setCompleteOpen(false)}>
            <div className="flex flex-col items-center gap-5 text-center">
              <h3 className="text-lg font-medium text-graphite">Would you like to complete?</h3>
              <AssemblyPreview placed={placed} />
              <Button className="w-full" onClick={handlePostIt}>Post it</Button>
            </div>
          </BottomSheet>
        </>
      )}
    </BuilderFrame>
  );
}

/**
 * The reference flow is a phone-app UI, but this is a web app: on a wide viewport the
 * interaction panel reads as a framed module on a page background, not a stretched phone screen.
 */
function BuilderFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] justify-center bg-stone sm:items-center sm:py-10">
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-ivory sm:h-[min(820px,90vh)] sm:w-[420px] sm:rounded-[2.5rem] sm:border sm:border-graphite/10 sm:shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function AssemblyPreview({ placed }: { placed: PlacedItem[] }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl bg-stone px-8 py-6">
      {placed.length === 0 ? (
        <p className="text-sm text-graphite-soft">No parts selected</p>
      ) : (
        <div className="flex flex-col items-center gap-0.5">
          {placed
            .slice()
            .sort((a, b) => a.y - b.y)
            .map((p) => (
              <PartPreviewThumb key={p.uid} item={p.item} />
            ))}
        </div>
      )}
    </div>
  );
}

function PartPreviewThumb({ item }: { item: BuildItem }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: Math.max(item.width, 20), height: Math.max(item.height, 20) }}
    >
      <PartShape item={item} />
    </div>
  );
}
