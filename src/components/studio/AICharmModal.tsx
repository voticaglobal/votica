import { useRef, useState } from "react";
import { Upload, Sparkles, ImageUp } from "lucide-react";
import { BottomSheet } from "../common/BottomSheet";
import { Button } from "../common/Button";
import { Chip } from "../common/Chip";
import { Textarea } from "../common/Field";
import { Loader } from "../common/Loader";
import { useDesign } from "../../context/DesignContext";
import { generateCustomCharm } from "../../services/ai";
import { trackEvent } from "../../services/analytics";
import { canAddCharm } from "../../services/manufacturing";
import { fileToDataUrl, hasAlphaTransparency, cutoutBackground } from "../../lib/image";
import { generateId } from "../../lib/utils";
import type { CustomCharmStyle, GeneratedCharm } from "../../types/jewelry";

const STYLES: { value: CustomCharmStyle; label: string }[] = [
  { value: "minimal", label: "Minimal" },
  { value: "cute", label: "Cute" },
  { value: "sculptural", label: "Sculptural" },
  { value: "outline", label: "Outline" },
];

export function AICharmModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentDesign, addCharm } = useDesign();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<string | undefined>(currentDesign.sourceImage);
  const [photoHasAlpha, setPhotoHasAlpha] = useState(false);
  const [style, setStyle] = useState<CustomCharmStyle>("minimal");
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "ready">("idle");
  const [result, setResult] = useState<GeneratedCharm | null>(null);
  const [loadingLabel, setLoadingLabel] = useState("");

  const reset = () => {
    setStatus("idle");
    setResult(null);
    setPrompt("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    setPhoto(dataUrl);
    setPhotoHasAlpha(await hasAlphaTransparency(dataUrl));
    trackEvent("photo_uploaded", { context: "ai_charm" });
  };

  const handleCreate = async () => {
    setStatus("generating");
    setLoadingLabel("Turning your photo into a charm... this can take up to 15 seconds.");
    const charm = await generateCustomCharm({ image: photo, style, prompt: prompt.trim() || undefined });
    setResult(charm);
    setStatus("ready");
    trackEvent("ai_charm_created", { style, hasPrompt: Boolean(prompt.trim()), source: "ai" });
  };

  const handleUseAsIs = async () => {
    if (!photo) return;
    setStatus("generating");
    setLoadingLabel("Preparing your photo...");
    const finalImage = photoHasAlpha ? photo : await cutoutBackground(photo).catch(() => photo);
    setResult({
      id: generateId("charm"),
      assetUrl: finalImage,
      style,
      label: "Using your photo directly — not manufacturing-ready yet.",
    });
    setStatus("ready");
    trackEvent("ai_charm_created", { source: "upload", alreadyTransparent: photoHasAlpha });
  };

  const handleAdd = () => {
    if (!canAddCharm(currentDesign)) return;
    addCharm("custom", { customAssetUrl: result?.assetUrl || photo });
    handleClose();
  };

  return (
    <BottomSheet open={open} onClose={handleClose} title="AI Charm">
      {status === "generating" && <Loader label={loadingLabel} />}

      {status === "idle" && (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-graphite">Photo</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-graphite/20 bg-stone text-graphite-soft hover:border-champagne"
            >
              {photo ? (
                <img src={photo} alt="Selected source" className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <>
                  <Upload size={20} />
                  <span className="text-sm">Upload a photo</span>
                </>
              )}
            </button>
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
            {photoHasAlpha && (
              <p className="mt-2 text-xs text-graphite-soft">
                This looks like it's already cut out — "Use This Photo" will skip AI generation entirely.
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-graphite">Style</p>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <Chip key={s.value} active={style === s.value} onClick={() => setStyle(s.value)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-graphite">Describe it (optional)</p>
            <Textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A tiny paw print, her collar tag shape, just the ears..."
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="w-full" onClick={handleCreate} disabled={!photo}>
              <Sparkles size={16} />
              Create Charm
            </Button>
            <Button className="w-full" variant="outline" onClick={handleUseAsIs} disabled={!photo}>
              <ImageUp size={16} />
              Use This Photo
            </Button>
          </div>
        </div>
      )}

      {status === "ready" && result && (
        <div className="space-y-5 text-center">
          {result.assetUrl || photo ? (
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-stone p-1.5 shadow-inner">
              <img
                src={result.assetUrl || photo}
                alt="Your custom charm preview"
                className="h-full w-full rounded-full border-2 border-champagne-light object-cover"
              />
            </div>
          ) : (
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-stone">
              <svg viewBox="-14 -14 28 28" className="h-16 w-16">
                <circle r="9" fill="#cfd3d8" stroke="rgba(0,0,0,0.15)" strokeWidth={0.4} />
                <path d="M-4 3 C-4 0 -3 -3 0 -3 C3 -3 4 0 4 3" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={1} strokeLinecap="round" />
                <circle cx="0" cy="-1.5" r="1.2" fill="rgba(0,0,0,0.4)" />
              </svg>
            </div>
          )}
          <p className="text-sm text-graphite-soft">{result.label}</p>
          <Button className="w-full" onClick={handleAdd}>
            Add to Jewelry
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
