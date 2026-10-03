import { dataUrlToParts } from "../lib/image";
import { generateId } from "../lib/utils";
import { previewAccessHeaders } from "../lib/previewAccess";
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

/**
 * A real failure (key configured, but the call errored — rate limit, bad
 * response, network blip) must never look like a successful demo concept.
 * Only `not_configured` (no key at all) is allowed to fall back to a demo.
 */
export type ConceptResult =
  | { kind: "success" | "demo"; concept: CharmConcept }
  | { kind: "error"; message: string; retryable: boolean }
  | { kind: "preview_locked" };

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

function toConceptFromServer(data: ServerConceptResponse): CharmConcept {
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
}

async function postConceptRequest(
  body: Record<string, unknown>,
  demoFallback: () => CharmConcept,
): Promise<ConceptResult> {
  let response: Response;
  try {
    response = await fetch("/api/generate-charm-concept", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...previewAccessHeaders() },
      body: JSON.stringify(body),
    });
  } catch {
    // Network failure — the endpoint may simply not exist here (e.g. `vite dev`
    // without `vercel dev`), which is indistinguishable from a real outage from
    // the browser's point of view. Treat it as "not configured" rather than a
    // hard error so local app-shell development isn't blocked, but this is the
    // one case where that assumption could hide a real production outage —
    // worth revisiting once this only ever runs behind a real deployment.
    return { kind: "demo", concept: demoFallback() };
  }

  if (response.status === 501) {
    return { kind: "demo", concept: demoFallback() };
  }

  if (response.status === 404) {
    // Endpoint not served at all (plain `vite dev`) — same reasoning as above.
    return { kind: "demo", concept: demoFallback() };
  }

  if (response.status === 401) {
    return { kind: "preview_locked" };
  }

  if (!response.ok) {
    let message = "Generation failed.";
    try {
      const data = await response.json();
      if (typeof data?.error === "string") message = data.error;
    } catch {
      // ignore — keep default message
    }
    const retryable = response.status === 429 || response.status >= 500;
    return { kind: "error", message, retryable };
  }

  try {
    const data: ServerConceptResponse = await response.json();
    if (!data.image) {
      return { kind: "error", message: "No concept image came back. Please try again.", retryable: true };
    }
    return { kind: "success", concept: toConceptFromServer(data) };
  } catch {
    return { kind: "error", message: "Couldn't read the generation response.", retryable: true };
  }
}

/** Generates one new charm concept from a brief. `variationIndex` nudges repeat calls toward a different take. */
export async function generateCharmConcept(
  brief: CharmBriefInput,
  variationIndex = 0,
): Promise<ConceptResult> {
  const photo = brief.sourceImage ? dataUrlToParts(brief.sourceImage) : null;
  return postConceptRequest(
    {
      brief: { ...brief, sourceImage: undefined, variationIndex },
      sourceImage: photo ? { base64: photo.base64, mimeType: photo.mimeType } : undefined,
    },
    () => demoConcept(brief),
  );
}

/** Edits an existing concept's image with a natural-language instruction, producing a new concept/version. */
export async function editCharmConcept(
  previousImageUrl: string,
  editRequestText: string,
): Promise<ConceptResult> {
  if (!previousImageUrl) return { kind: "demo", concept: demoConcept(null, editRequestText) };
  return postConceptRequest(
    { editOf: { imageDataUrl: previousImageUrl, editRequestText } },
    () => demoConcept(null, editRequestText),
  );
}
