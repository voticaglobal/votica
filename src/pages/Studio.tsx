import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { HoopCanvas } from "../components/studio/HoopCanvas";
import { CharmControls } from "../components/studio/CharmControls";
import { CharmLibrarySheet } from "../components/studio/CharmLibrarySheet";
import { AICharmModal } from "../components/studio/AICharmModal";
import { StudioToolbar } from "../components/studio/StudioToolbar";
import { BottomSheet } from "../components/common/BottomSheet";
import { MaterialPicker } from "../components/studio/MaterialPicker";
import { BaseReferenceSheet } from "../components/studio/BaseReferenceSheet";
import { useDesign } from "../context/DesignContext";
import { calculateEstimatedPrice } from "../services/pricing";
import { trackEvent } from "../services/analytics";
import { formatCurrency } from "../lib/utils";

export function Studio() {
  const navigate = useNavigate();
  const { currentDesign, saveCurrentDesign } = useDesign();

  const [selectedCharmId, setSelectedCharmId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [baseOpen, setBaseOpen] = useState(false);
  const [aiCharmOpen, setAiCharmOpen] = useState(false);

  useEffect(() => {
    trackEvent("studio_opened", { designId: currentDesign.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCharm = currentDesign.charms.find((c) => c.id === selectedCharmId) ?? null;
  const price = calculateEstimatedPrice(currentDesign);

  const handlePreview = () => {
    const saved = saveCurrentDesign();
    trackEvent("preview_clicked", { designId: saved.id });
    navigate(`/design/${saved.id}`);
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-stone">
      <header
        className="flex items-center justify-between border-b border-graphite/10 bg-ivory px-4 py-3"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 rounded-full p-2 text-graphite-soft hover:bg-stone"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-graphite">{currentDesign.name}</p>
          <p className="text-xs text-graphite-soft">{currentDesign.charms.length}/5 charms</p>
        </div>
        <div className="min-w-[64px] text-right text-sm font-medium text-graphite">
          {formatCurrency(price)}
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        <HoopCanvas
          selectedCharmId={selectedCharmId}
          onSelectCharm={setSelectedCharmId}
          className="mx-auto block max-w-md px-8 py-6"
        />
      </main>

      {selectedCharm && (
        <div className="px-4 pb-3">
          <CharmControls charm={selectedCharm} onDeselect={() => setSelectedCharmId(null)} />
        </div>
      )}

      <StudioToolbar
        onAddCharm={() => setLibraryOpen(true)}
        onMaterial={() => setMaterialOpen(true)}
        onBase={() => setBaseOpen(true)}
        onAiCharm={() => setAiCharmOpen(true)}
        onPreview={handlePreview}
      />

      <CharmLibrarySheet
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onOpenAiCharm={() => setAiCharmOpen(true)}
      />

      <AICharmModal open={aiCharmOpen} onClose={() => setAiCharmOpen(false)} />

      <BottomSheet open={materialOpen} onClose={() => setMaterialOpen(false)} title="Material">
        <MaterialPicker />
      </BottomSheet>

      <BottomSheet open={baseOpen} onClose={() => setBaseOpen(false)} title="Base reference">
        <BaseReferenceSheet />
      </BottomSheet>
    </div>
  );
}
