import type {
  GenerateCharmInput,
  GenerateConceptInput,
  GeneratedCharm,
  JewelryConcept,
  MaterialType,
  ProductType,
  StyleType,
} from "../types/jewelry";
import { DEMO_CONCEPTS } from "../data/demo";
import { generateId } from "../lib/utils";
import { dataUrlToParts, cutoutBackground } from "../lib/image";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls the /api/generate-image serverless function (Gemini 2.5 Flash Image
 * server-side, key never reaches the client). Returns null on any failure —
 * every caller falls back to a procedural/demo asset when this happens, so
 * the app keeps working with no API key configured.
 */
async function requestGeneratedImage(prompt: string, sourceImage?: string): Promise<string | null> {
  try {
    const photo = sourceImage ? dataUrlToParts(sourceImage) : null;
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        photoBase64: photo?.base64,
        photoMimeType: photo?.mimeType,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data?.image === "string" ? data.image : null;
  } catch {
    return null;
  }
}

const STYLE_WORDS: Record<StyleType, string> = {
  minimal: "minimalist",
  cute: "playful and cute",
  vintage: "vintage-inspired",
  elegant: "elegant",
  bold: "bold, statement",
};

const MATERIAL_WORDS: Record<MaterialType, string> = {
  silver: "polished 925 sterling silver",
  "gold-vermeil": "warm gold vermeil",
  "rose-gold": "soft rose gold",
};

const PRODUCT_WORDS: Record<ProductType, string> = {
  "hoop-earring": "hoop earring",
  pendant: "pendant necklace",
  ring: "ring",
  necklace: "necklace",
};

function buildConceptPrompt(concept: JewelryConcept, input: GenerateConceptInput): string {
  return [
    `Professional product photography of a single ${MATERIAL_WORDS[input.material]} ${PRODUCT_WORDS[input.productType]}, ${STYLE_WORDS[input.style]} style.`,
    concept.description,
    input.story ? `Take inspiration from this story, without depicting it literally: ${input.story}.` : "",
    "Clean plain ivory background, soft editorial studio lighting, macro jewelry photography, sharp focus, no text, no watermark.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Generates 3 concept renders in parallel via Gemini, seeded by the fixed
 * DEMO_CONCEPTS templates (name/description/suggested charms stay curated —
 * the hero image, material, and product type all come from the live input,
 * so every card reflects what the customer actually chose). Any concept
 * whose image call fails keeps `image: ""`, which the UI renders as a
 * procedural SVG preview instead of a photo.
 */
export async function generateJewelryConcept(input: GenerateConceptInput): Promise<JewelryConcept[]> {
  const [, results] = await Promise.all([
    delay(400),
    Promise.all(
      DEMO_CONCEPTS.map(async (concept) => {
        const seeded = { ...concept, material: input.material };
        const image = await requestGeneratedImage(buildConceptPrompt(seeded, input), input.sourceImage);
        return {
          ...seeded,
          id: `${concept.id}-${generateId("gen")}`,
          productType: input.productType,
          image: image ?? "",
        };
      }),
    ),
  ]);

  return results;
}

const CHARM_STYLE_WORDS: Record<GenerateCharmInput["style"], string> = {
  minimal: "minimalist line-art",
  cute: "cute and playful",
  sculptural: "sculptural, dimensional relief",
  outline: "simple thin outline silhouette",
};

/**
 * Generates one custom charm render via Gemini, using the uploaded photo as
 * visual reference. The model can't output real alpha transparency (asking for
 * "transparent background" makes it paint a literal checkerboard), so the
 * prompt instead forces a flat, shadowless white background that `cutoutBackground`
 * can reliably flood-fill into real transparency afterwards. Falls back to an
 * empty assetUrl (studio shows the raw uploaded photo, then a generic silhouette)
 * when generation isn't available.
 */
export async function generateCustomCharm(input: GenerateCharmInput): Promise<GeneratedCharm> {
  const prompt = [
    `The flat face of a single circular jewelry charm medallion, ${CHARM_STYLE_WORDS[input.style]} design inspired by the attached photo.`,
    input.prompt ? `Additional direction from the customer: ${input.prompt}.` : "",
    "This charm is only about 10mm across in real life, so the engraving must be reduced to ONE simple, bold, iconic shape (e.g. just the pet's head, or just a paw, or one clear symbol) — thick clear lines, almost no fine detail, nothing that would disappear at tiny size.",
    "Do NOT depict a full scene, background elements, landscape, or multiple objects — a single subject only, filling most of the circle.",
    "Polished metal finish, macro product photography, shot dead-on (not at an angle) so the circular face fills almost the entire frame edge to edge with only a thin sliver of margin.",
    "Do NOT draw a chain, jump ring, bail, or hanging loop above it — only the flat circular medallion face itself, nothing above or beside it.",
    "Background: pure flat solid white (#FFFFFF), completely uniform, no gradient, no shadow, no texture, no vignette.",
    "No text, no watermark.",
  ]
    .filter(Boolean)
    .join(" ");

  const rawImage = await requestGeneratedImage(prompt, input.image);
  let image = rawImage;
  if (rawImage) {
    try {
      image = await cutoutBackground(rawImage);
    } catch {
      image = rawImage;
    }
  }

  return {
    id: generateId("charm"),
    assetUrl: image ?? "",
    style: input.style,
    label: image
      ? "A preview of your custom charm — not manufacturing-ready yet."
      : "Custom charm preview unavailable right now — showing your photo instead.",
  };
}

export type ProductPreviewResult = {
  readyAt: string;
  note: string;
};

/**
 * Placeholder for a future photoreal render pass. For the MVP the studio's own
 * SVG canvas is the preview, so this only simulates the "review" delay.
 */
export async function generateProductPreview(): Promise<ProductPreviewResult> {
  await delay(900);
  return {
    readyAt: new Date().toISOString(),
    note: "Your final design will be reviewed for manufacturability before production.",
  };
}
