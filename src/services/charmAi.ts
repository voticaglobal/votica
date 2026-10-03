import { dataUrlToParts } from "../lib/image";
import { generateId } from "../lib/utils";
import type { CharmBriefInput, CharmConcept } from "../types/charmStudio";

type ServerConceptResponse = {
  image: string;
  name: string;
  designIntent: string;
  connectionDescription: string;
  needsReview: string[];
  imageModel: string;
  analysisModel: string | null;
};

const DEMO_NOTE = "Demo concept — no Gemini API key configured, so this isn't a real generation.";

function demoConcept(brief: CharmBriefInput | null, editRequestText?: string): CharmConcept {
  return {
    id: generateId("concept"),
    name: editRequestText ? "Demo concept (edited)" : "Demo concept",
    designIntent: editRequestText
      ? `Demo placeholder — would apply "${editRequestText}" to the previous concept.`
      : brief?.description
        ? `Demo placeholder inspired by: "${brief.description}".`
        : "Demo placeholder concept.",
    imageUrl: "",
    connectionDescription: "A top connection loop would be requested — not generated in demo mode.",
    needsReview: [DEMO_NOTE, "Loop and connector dimensions — not yet confirmed by manufacturing"],
    loop: { requested: true, position: "top_center", reviewStatus: "needs_review" },
    connector: { type: "unspecified", reviewStatus: "needs_review" },
    imageModel: "none (demo)",
    analysisModel: null,
    isDemo: true,
  };
}

async function postConceptRequest(body: Record<string, unknown>): Promise<CharmConcept | null> {
  try {
    const response = await fetch("/api/generate-charm-concept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return null;
    const data: ServerConceptResponse = await response.json();
    return {
      id: generateId("concept"),
      name: data.name,
      designIntent: data.designIntent,
      imageUrl: data.image,
      connectionDescription: data.connectionDescription,
      needsReview: data.needsReview,
      loop: { requested: true, position: "top_center", reviewStatus: "needs_review" },
      connector: { type: "unspecified", reviewStatus: "needs_review" },
      imageModel: data.imageModel,
      analysisModel: data.analysisModel,
      isDemo: false,
    };
  } catch {
    return null;
  }
}

/** Generates one new charm concept from a brief. `variationIndex` nudges repeat calls toward a different take. */
export async function generateCharmConcept(
  brief: CharmBriefInput,
  variationIndex = 0,
): Promise<CharmConcept> {
  const photo = brief.sourceImage ? dataUrlToParts(brief.sourceImage) : null;
  const result = await postConceptRequest({
    brief: { ...brief, sourceImage: undefined, variationIndex },
    sourceImage: photo ? { base64: photo.base64, mimeType: photo.mimeType } : undefined,
  });
  return result ?? demoConcept(brief);
}

/** Edits an existing concept's image with a natural-language instruction, producing a new concept/version. */
export async function editCharmConcept(
  previousImageUrl: string,
  editRequestText: string,
): Promise<CharmConcept> {
  if (!previousImageUrl) return demoConcept(null, editRequestText);
  const result = await postConceptRequest({
    editOf: { imageDataUrl: previousImageUrl, editRequestText },
  });
  return result ?? demoConcept(null, editRequestText);
}
