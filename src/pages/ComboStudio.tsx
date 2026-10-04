import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Pencil, Eye, Play, Pause } from "lucide-react";
import { Container } from "../components/common/Container";
import { Button } from "../components/common/Button";
import { Chip } from "../components/common/Chip";
import { DemoNotice } from "../components/common/DemoNotice";
import { ComboCanvas, ZoomControls } from "../components/combo/ComboCanvas";
import { ComboPartPicker } from "../components/combo/ComboPartPicker";
import { loadCombo, saveCombo, addNode, removeNode } from "../services/comboStore";
import { getPart } from "../data/parts";
import { trackEvent } from "../services/analytics";
import type { PartCombo } from "../types/combo";
import type { ChildAttachmentPoint } from "../types/catalog";

type ViewMode = "combo" | "hoop_only" | "charm_only";

export function ComboStudio() {
  const navigate = useNavigate();
  const [combo, setCombo] = useState<PartCombo>(() => loadCombo());
  const [editMode, setEditMode] = useState(true);
  const [motionOn, setMotionOn] = useState(true);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<ViewMode>("combo");
  const [pickerSlot, setPickerSlot] = useState<{ parentUid: string | null; slot: ChildAttachmentPoint } | null>(null);

  useEffect(() => {
    trackEvent("part_added", { context: "combo_studio_opened" });
  }, []);

  useEffect(() => {
    saveCombo(combo);
  }, [combo]);

  const handleChoosePart = (partId: string) => {
    if (!pickerSlot) return;
    setCombo((prev) => addNode(prev, partId, pickerSlot.parentUid, pickerSlot.slot.id));
    setPickerSlot(null);
  };

  const handleDelete = (uid: string) => {
    setCombo((prev) => removeNode(prev, uid));
    setSelectedUid(null);
  };

  const effectiveCombo: PartCombo =
    view === "hoop_only" ? { ...combo, nodes: [] } : view === "charm_only" ? { ...combo, nodes: combo.nodes.slice(-1) } : combo;

  return (
    <Container className="py-10 pb-24 sm:py-16">
      <button type="button" className="mb-4 flex items-center gap-1 text-sm text-graphite-soft hover:underline" onClick={() => navigate(-1)}>
        <ChevronLeft size={16} /> Back
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-graphite sm:text-3xl">Build with real parts.</h1>
          <p className="mt-1 text-sm text-graphite-soft">Hoop → connector → charm, from the real parts catalog.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditMode((v) => !v)}>
          {editMode ? <Eye size={15} /> : <Pencil size={15} />}
          {editMode ? "Preview & swing" : "Edit"}
        </Button>
      </div>

      <DemoNotice className="mb-6">
        Physical "hanging and swinging" here is a visual demo only — it does not confirm real weight,
        strength, or that this combination can actually be manufactured.
      </DemoNotice>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Chip active={view === "combo"} onClick={() => setView("combo")}>Combo</Chip>
              <Chip active={view === "hoop_only"} onClick={() => setView("hoop_only")}>Hoop only</Chip>
              <Chip active={view === "charm_only"} onClick={() => setView("charm_only")}>Charm only</Chip>
            </div>
            <ZoomControls zoom={zoom} onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 2))} onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.5))} />
          </div>

          <ComboCanvas
            combo={effectiveCombo}
            editMode={editMode}
            motionOn={motionOn}
            selectedUid={selectedUid}
            onSelect={setSelectedUid}
            onDelete={handleDelete}
            onOpenSlotPicker={(parentUid, slot) => setPickerSlot({ parentUid, slot })}
            zoom={zoom}
            showHoop={view !== "charm_only"}
          />

          {!editMode && (
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setMotionOn((v) => !v)}>
                {motionOn ? <Pause size={14} /> : <Play size={14} />}
                {motionOn ? "Turn motion off" : "Turn motion on"}
              </Button>
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">In this combo</h2>
          <ul className="space-y-2">
            {combo.nodes.map((n) => {
              const part = getPart(n.partId);
              return (
                <li key={n.uid} className="flex items-center gap-3 rounded-xl bg-stone px-3 py-2 text-sm">
                  {part && <img src={part.imageUrl} alt={part.name} className="h-8 w-8 object-contain" />}
                  <span className="text-graphite">{part?.id ?? n.partId}</span>
                  <span className="text-xs text-graphite-soft">{part?.category}</span>
                </li>
              );
            })}
            {combo.nodes.length === 0 && <p className="text-sm text-graphite-soft">Nothing added yet — tap the + in edit mode.</p>}
          </ul>

          <div className="mt-6 rounded-2xl bg-stone p-4 text-xs text-graphite-soft">
            <p className="font-medium text-graphite">About this preview</p>
            <p className="mt-1">
              Only 3 catalog parts are calibrated with real connection points so far (the base hoop, one
              connector, one charm) — see the session report for the full list and which images still
              need the attachment-point editor.
            </p>
          </div>

          <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => navigate("/create")}>
            Go to AI Charm Creator →
          </Button>
        </div>
      </div>

      <ComboPartPicker
        open={!!pickerSlot}
        onClose={() => setPickerSlot(null)}
        slot={pickerSlot?.slot ?? null}
        onChoose={handleChoosePart}
      />
    </Container>
  );
}
