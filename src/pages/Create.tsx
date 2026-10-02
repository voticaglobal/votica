import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, ArrowRight } from "lucide-react";
import { Container } from "../components/common/Container";
import { Button } from "../components/common/Button";
import { Chip } from "../components/common/Chip";
import { Textarea } from "../components/common/Field";
import { Loader } from "../components/common/Loader";
import { HoopPreview } from "../components/studio/HoopPreview";
import { useDesign } from "../context/DesignContext";
import { generateJewelryConcept } from "../services/ai";
import { calculateEstimatedPrice } from "../services/pricing";
import { trackEvent } from "../services/analytics";
import { formatCurrency } from "../lib/utils";
import type {
  GemstoneType,
  JewelryConcept,
  MaterialType,
  ProductType,
  StyleType,
} from "../types/jewelry";
import { DEMO_STORY } from "../data/demo";
import { fileToDataUrl } from "../lib/image";

const STORY_CHIPS = ["Pet", "Memory", "Couple", "Initial", "Symbol", "Original Fandom"];

const PRODUCTS: { value: ProductType; label: string; comingSoon?: boolean }[] = [
  { value: "hoop-earring", label: "Hoop Earring" },
  { value: "pendant", label: "Pendant" },
  { value: "ring", label: "Ring", comingSoon: true },
  { value: "necklace", label: "Necklace", comingSoon: true },
];

const STYLES: { value: StyleType; label: string }[] = [
  { value: "minimal", label: "Minimal" },
  { value: "cute", label: "Cute" },
  { value: "vintage", label: "Vintage" },
  { value: "elegant", label: "Elegant" },
  { value: "bold", label: "Bold" },
];

const MATERIALS: { value: MaterialType; label: string }[] = [
  { value: "silver", label: "925 Silver" },
  { value: "gold-vermeil", label: "Gold Vermeil" },
  { value: "rose-gold", label: "Rose Gold" },
];

const GEMSTONES: { value: GemstoneType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "crystal", label: "Crystal" },
  { value: "birthstone", label: "Birthstone" },
];

export function Create() {
  const navigate = useNavigate();
  const { createFromConcept } = useDesign();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sourceImage, setSourceImage] = useState<string | undefined>();
  const [story, setStory] = useState("");
  const [productType, setProductType] = useState<ProductType>("hoop-earring");
  const [style, setStyle] = useState<StyleType>("minimal");
  const [material, setMaterial] = useState<MaterialType>("silver");
  const [gemstone, setGemstone] = useState<GemstoneType>("none");

  const [status, setStatus] = useState<"idle" | "generating" | "results">("idle");
  const [concepts, setConcepts] = useState<JewelryConcept[]>([]);

  useEffect(() => {
    trackEvent("create_started");
  }, []);

  const handleFile = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    setSourceImage(dataUrl);
    trackEvent("photo_uploaded", { context: "create" });
  };

  const handleGenerate = async () => {
    setStatus("generating");
    const results = await generateJewelryConcept({
      sourceImage,
      story: story || DEMO_STORY,
      productType,
      style,
      material,
      gemstone,
    });
    setConcepts(results);
    setStatus("results");
    trackEvent("design_generated", { count: results.length });
  };

  const handleSelectConcept = (concept: JewelryConcept) => {
    const design = createFromConcept(concept, story || DEMO_STORY, sourceImage);
    trackEvent("design_selected", { conceptId: concept.id, designId: design.id });
    navigate("/studio");
  };

  if (status === "generating") {
    return (
      <Container className="py-24">
        <Loader label="Turning your story into jewelry... this can take up to 30 seconds." />
      </Container>
    );
  }

  if (status === "results") {
    return (
      <Container className="py-14 sm:py-20">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-medium text-graphite sm:text-4xl">Here's what we imagined.</h1>
          <p className="mt-3 text-graphite-soft">Choose one to make it yours.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {concepts.map((concept) => (
            <div
              key={concept.id}
              className="flex flex-col rounded-3xl border border-graphite/8 bg-white p-6"
            >
              <div className="mb-4 aspect-square overflow-hidden rounded-2xl bg-stone p-6">
                {concept.image ? (
                  <img
                    src={concept.image}
                    alt={concept.name}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  <HoopPreview
                    design={{
                      id: concept.id,
                      name: concept.name,
                      productType: concept.productType,
                      material: concept.material,
                      charms: concept.suggestedCharms.slice(0, 3).map((type, i) => ({
                        id: `${concept.id}-preview-${i}`,
                        type,
                        attachmentPointId: `hoop-ap-${2 + i * 2}`,
                        scale: 1,
                        rotation: 0,
                        material: concept.material,
                        text: type === "initial" ? "A" : undefined,
                      })),
                      createdAt: "",
                      updatedAt: "",
                    }}
                  />
                )}
              </div>
              <h3 className="font-serif text-xl text-graphite">{concept.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-graphite-soft">{concept.description}</p>
              <p className="mt-4 text-sm font-medium text-graphite">
                Estimated {formatCurrency(calculateEstimatedPrice({
                  productType: concept.productType,
                  material: concept.material,
                  charms: concept.suggestedCharms.map((type) => ({
                    id: "",
                    type,
                    attachmentPointId: "",
                    scale: 1,
                    rotation: 0,
                    material: concept.material,
                  })),
                }))}
              </p>
              <Button className="mt-4 w-full" onClick={() => handleSelectConcept(concept)}>
                Customize This
              </Button>
            </div>
          ))}
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10 pb-32 sm:py-16">
      <div className="mb-10 max-w-xl">
        <h1 className="text-3xl font-medium text-graphite sm:text-4xl">Start with something meaningful.</h1>
        <p className="mt-3 text-graphite-soft">A photo, sketch, symbol, or simply an idea.</p>
      </div>

      <div className="space-y-10 max-w-2xl">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">
            01 · Upload something meaningful
          </h2>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-graphite/20 bg-stone text-graphite-soft hover:border-champagne"
          >
            {sourceImage ? (
              <img src={sourceImage} alt="Uploaded source" className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <>
                <Upload size={22} />
                <span className="text-sm">Photo · Sketch · Inspiration</span>
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
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">
            02 · What would you like to create?
          </h2>
          <Textarea
            rows={3}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Turn my dog into a minimal vintage silver charm..."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {STORY_CHIPS.map((chip) => (
              <Chip key={chip} onClick={() => setStory((s) => (s ? `${s} ${chip}` : chip))}>
                {chip}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">
            03 · Choose product
          </h2>
          <div className="flex flex-wrap gap-2">
            {PRODUCTS.map((p) => (
              <Chip
                key={p.value}
                active={productType === p.value}
                disabled={p.comingSoon}
                onClick={() => setProductType(p.value)}
              >
                {p.label}
                {p.comingSoon ? " · Coming Soon" : ""}
              </Chip>
            ))}
          </div>
        </section>

        <section className="grid gap-8 sm:grid-cols-3">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">Style</h2>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <Chip key={s.value} active={style === s.value} onClick={() => setStyle(s.value)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">Material</h2>
            <div className="flex flex-wrap gap-2">
              {MATERIALS.map((m) => (
                <Chip key={m.value} active={material === m.value} onClick={() => setMaterial(m.value)}>
                  {m.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-soft">Gemstone</h2>
            <div className="flex flex-wrap gap-2">
              {GEMSTONES.map((g) => (
                <Chip key={g.value} active={gemstone === g.value} onClick={() => setGemstone(g.value)}>
                  {g.label}
                </Chip>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-graphite/10 bg-ivory/95 p-4 backdrop-blur-md" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
        <Container>
          <Button size="lg" className="w-full sm:w-auto" onClick={handleGenerate}>
            Generate My Jewelry
            <ArrowRight size={16} />
          </Button>
        </Container>
      </div>
    </Container>
  );
}
