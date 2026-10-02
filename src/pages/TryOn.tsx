import { useRef, useState } from "react";
import { Upload, RotateCcw } from "lucide-react";
import { Container } from "../components/common/Container";
import { Button } from "../components/common/Button";
import { Chip } from "../components/common/Chip";
import { EarringCanvas } from "../components/tryon/EarringCanvas";
import { DEFAULT_EAR_PHOTOS, EARRING_OPTIONS } from "../data/tryon";
import { fileToDataUrl, hasAlphaTransparency, cutoutBackground } from "../lib/image";
import { trackEvent } from "../services/analytics";
import type { EarringOption } from "../types/tryon";

export function TryOn() {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const earringInputRef = useRef<HTMLInputElement>(null);

  const [photoUrl, setPhotoUrl] = useState(DEFAULT_EAR_PHOTOS[0].image);
  const [earring, setEarring] = useState<EarringOption>(EARRING_OPTIONS[0]);
  const [customEarring, setCustomEarring] = useState<EarringOption | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const handlePhotoUpload = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    setPhotoUrl(dataUrl);
    trackEvent("photo_uploaded", { context: "try_on_ear" });
  };

  const handleEarringUpload = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    const alreadyCut = await hasAlphaTransparency(dataUrl);
    const finalImage = alreadyCut ? dataUrl : await cutoutBackground(dataUrl).catch(() => dataUrl);
    const option: EarringOption = {
      id: "custom",
      label: "Your earring",
      image: finalImage,
      displayWidth: 64,
      chainLength: 12,
    };
    setCustomEarring(option);
    setEarring(option);
    trackEvent("photo_uploaded", { context: "try_on_earring" });
  };

  const options = customEarring ? [...EARRING_OPTIONS, customEarring] : EARRING_OPTIONS;

  return (
    <Container className="py-10 pb-24 sm:py-16">
      <div className="mb-8 max-w-xl">
        <h1 className="text-3xl font-medium text-graphite sm:text-4xl">Try it on.</h1>
        <p className="mt-3 text-graphite-soft">
          Place an earring on a photo of your ear and see it hang and swing the way it actually would.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <EarringCanvas key={`${photoUrl}-${earring.id}-${resetKey}`} photoUrl={photoUrl} earring={earring} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => photoInputRef.current?.click()}>
              <Upload size={15} />
              Use My Photo
            </Button>
            <Button size="sm" variant="outline" onClick={() => setResetKey((k) => k + 1)}>
              <RotateCcw size={15} />
              Reset Pin
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">Earring</h2>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <Chip key={o.id} active={earring.id === o.id} onClick={() => setEarring(o)}>
                {o.label}
              </Chip>
            ))}
            <Chip onClick={() => earringInputRef.current?.click()}>+ Upload your own</Chip>
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

          <div className="mt-6 space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite-soft">Sample photos</h2>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_EAR_PHOTOS.map((p) => (
                <Chip key={p.id} active={photoUrl === p.image} onClick={() => setPhotoUrl(p.image)}>
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-graphite-soft">
            Tap anywhere on the photo to pin the earring there — it hangs with real gravity. Drag it
            and let go to see it swing.
          </p>
        </div>
      </div>
    </Container>
  );
}
