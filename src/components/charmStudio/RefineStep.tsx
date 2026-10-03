import { useState } from "react";
import { History, Loader2 } from "lucide-react";
import { Button } from "../common/Button";
import { Textarea } from "../common/Field";
import { PreviewAccessPrompt } from "./PreviewAccessPrompt";
import { useCharmDesign } from "../../context/CharmDesignContext";
import { cn } from "../../lib/utils";

const QUICK_EDITS = [
  { label: "Simpler", text: "make the shape simpler, with fewer details" },
  { label: "Rounder", text: "make the edges and corners rounder and softer" },
  { label: "Less detail", text: "reduce fine detail so it stays clear at small scale" },
  { label: "Change finish color", text: null }, // display-only, no AI call — see note below
];

export function RefineStep({ onContinue }: { onContinue: () => void }) {
  const { design, isGenerating, requestEdit, restoreVersion } = useCharmDesign();
  const [customEdit, setCustomEdit] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [previewLocked, setPreviewLocked] = useState(false);

  if (!design) return null;
  const currentVersion = design.versions.find((v) => v.id === design.currentVersionId);
  const concept = currentVersion?.concept;

  const handleResult = (result: { ok: boolean; message?: string }) => {
    if (!result.ok && result.message === "preview_locked") {
      setPreviewLocked(true);
      setMessage(null);
      return;
    }
    setPreviewLocked(false);
    setMessage(result.ok ? null : (result.message ?? null));
  };

  const handleQuickEdit = async (text: string | null) => {
    if (!text) {
      setMessage("Finish color is applied at review time — it doesn't need a new concept image.");
      return;
    }
    if (isGenerating) return;
    handleResult(await requestEdit(text));
  };

  const handleCustomEdit = async () => {
    if (!customEdit.trim() || isGenerating) return;
    const result = await requestEdit(customEdit.trim());
    handleResult(result);
    if (result.ok) setCustomEdit("");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <div className="relative flex aspect-square items-center justify-center rounded-3xl bg-stone p-10">
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-ivory/70">
              <Loader2 className="animate-spin text-graphite-soft" size={28} />
            </div>
          )}
          {concept?.imageUrl ? (
            <img src={concept.imageUrl} alt={concept.name} className="h-full w-full object-contain" />
          ) : (
            <svg viewBox="-12 -12 24 24" className="h-24 w-24">
              <circle r="9" fill="#e4d3ab" stroke="#c9a86a" strokeWidth="1" />
            </svg>
          )}
        </div>

        {design.versions.length > 1 && (
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-graphite-soft">
              <History size={13} /> Version history
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {design.versions.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={v.status !== "succeeded"}
                  onClick={() => restoreVersion(v.id)}
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border bg-white p-1 disabled:opacity-40",
                    v.id === design.currentVersionId ? "border-champagne" : "border-graphite/10",
                  )}
                  title={v.editRequestText ?? `Version ${i + 1}`}
                >
                  {v.status === "running" ? (
                    <Loader2 className="animate-spin text-graphite-soft" size={16} />
                  ) : v.status === "failed" ? (
                    <span className="text-[10px] text-graphite-soft">Failed</span>
                  ) : v.concept?.imageUrl ? (
                    <img src={v.concept.imageUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-graphite-soft">v{i + 1}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="font-serif text-2xl text-graphite">{concept?.name ?? "Your concept"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-graphite-soft">{concept?.designIntent}</p>

        <div className="mt-4 rounded-2xl bg-stone p-4">
          <p className="text-xs font-medium text-graphite">Connection point</p>
          <p className="mt-1 text-xs leading-relaxed text-graphite-soft">{concept?.connectionDescription}</p>
          {concept?.needsReview.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {concept.needsReview.map((item) => (
                <span key={item} className="rounded-full bg-champagne-light/60 px-2 py-0.5 text-[10px] text-graphite-soft">
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {message && <p className="mt-3 text-xs text-graphite-soft">{message}</p>}
        {previewLocked && <PreviewAccessPrompt onUnlocked={() => setPreviewLocked(false)} />}

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-graphite-soft">Quick edits</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_EDITS.map((qe) => (
              <button
                key={qe.label}
                type="button"
                disabled={isGenerating}
                onClick={() => handleQuickEdit(qe.text)}
                className="rounded-full border border-graphite/15 px-3.5 py-1.5 text-xs font-medium text-graphite transition hover:border-champagne disabled:opacity-40"
              >
                {qe.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <Textarea
            rows={2}
            value={customEdit}
            onChange={(e) => setCustomEdit(e.target.value)}
            placeholder="Or describe your own change..."
            disabled={isGenerating}
          />
          <Button size="sm" className="mt-2" onClick={handleCustomEdit} disabled={isGenerating || !customEdit.trim()}>
            {isGenerating ? "Working..." : "Apply Edit"}
          </Button>
        </div>

        <Button size="lg" variant="outline" className="mt-8 w-full" onClick={onContinue} disabled={isGenerating}>
          Preview On Hoop
        </Button>
      </div>
    </div>
  );
}
