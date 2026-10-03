// Vercel serverless function for the "Create Your Charm" flow.
//
// Two Gemini calls, two different models, per the official docs (verified live
// during implementation, not from memory):
//   - Image generation/edit: gemini-2.5-flash-image (text+image in, text+image out)
//     https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash-image
//   - Structured description of that image: gemini-2.5-flash with
//     generationConfig.responseMimeType=application/json + responseSchema
//     https://ai.google.dev/docs (Gemini Developer API, generateContent, v1beta)
//
// GEMINI_API_KEY stays server-side only. Returns 501 when unconfigured so the
// client falls back to its clearly-labeled demo concept generator — this
// function never pretends a demo result came from a real model call.
//
// IMPORTANT HONESTY CONSTRAINT (spec §5): the structured call describes what the
// image appears to show. It is never allowed to declare the design production-
// ready — the server always force-adds a baseline "needs review" item for the
// loop/connector regardless of what the model reports, because a photo alone
// can never confirm real-world manufacturability.

const IMAGE_MODEL = "gemini-2.5-flash-image";
const ANALYSIS_MODEL = "gemini-2.5-flash";
const BASELINE_NEEDS_REVIEW = "Loop and connector dimensions — not yet confirmed by manufacturing";

const STYLE_WORDS = { minimal: "minimalist", cute: "playful and cute", elegant: "elegant and refined" };
const REPRESENTATION_WORDS = {
  flat_silhouette: "a flat, single-layer silhouette shape, cut from sheet metal",
  engraved_plate: "a flat plate with an engraved/etched line design on its face",
  relief_concept: "a dimensional relief concept — raised, sculpted detail (concept only, not a final manufacturing form)",
};
const THEME_WORDS = {
  pet: "inspired by a pet's likeness",
  initial: "built around a single letter initial",
  memory: "inspired by a meaningful personal memory or object",
  symbol: "built around a simple meaningful symbol",
  original: "an original design",
};
const FINISH_WORDS = {
  silver: "polished 925 silver",
  "gold-vermeil": "warm gold vermeil (yellow gold tone)",
  "rose-gold": "soft rose gold tone",
};

const VARIATION_HINTS = [
  "",
  "Take a noticeably different stylistic interpretation than a straightforward first attempt would — explore an alternate angle on the same idea.",
  "Take a third, distinctly different interpretation again — vary the composition or motif treatment from the other attempts.",
];

function buildImagePrompt(brief) {
  return [
    `A single jewelry charm concept, ${STYLE_WORDS[brief.style] ?? "minimalist"} style, ${THEME_WORDS[brief.theme] ?? "an original design"}, rendered as ${REPRESENTATION_WORDS[brief.representation] ?? REPRESENTATION_WORDS.flat_silhouette}.`,
    brief.description ? `Design direction from the customer: ${brief.description}.` : "",
    brief.initialText ? `Include the initial "${brief.initialText}" only if it fits naturally in the design.` : "",
    VARIATION_HINTS[Math.min(brief.variationIndex ?? 0, VARIATION_HINTS.length - 1)],
    "Show ONLY this one charm — not a full necklace, not a hoop earring, not a model, hand, or ear. No jewelry other than this single charm.",
    "Shot dead-on from the front so the full flat shape is clearly visible, filling most of the frame.",
    "The charm must show a small connection loop or hole at the TOP CENTER of the piece, clearly part of the design — this is how it attaches to a hoop or chain.",
    "The form must be simple and bold enough to stay recognizable at real charm scale (under 15mm) — thick clear lines, almost no fine or disconnected detail, no thin dangling elements that could break off.",
    "Capture the subject as a clean, reduced silhouette rather than a miniaturized full photo.",
    `Rendered in ${FINISH_WORDS[brief.finishColor] ?? "polished metal"}, macro product photography, pure flat solid white background, no gradient, no shadow, no vignette, no text or watermark unless an initial letter was explicitly requested above.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildEditPrompt(editRequestText) {
  return [
    `Modify the attached charm concept image: ${editRequestText}.`,
    "Keep it a single standalone charm shot dead-on from the front, pure flat white background, no hoop/model/hand/ear in frame.",
    "Keep the small connection loop or hole at the top center of the piece — never remove it.",
    "Keep the form simple and bold enough to stay recognizable at real charm scale (under 15mm).",
  ].join(" ");
}

const CONCEPT_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", description: "A short, friendly name for this charm concept (2-4 words)." },
    designIntent: { type: "string", description: "One sentence describing the design idea in plain language." },
    connectionDescription: {
      type: "string",
      description: "One plain-language sentence describing where/how this charm appears to connect to a hoop or chain, based only on what is visible in the image.",
    },
    loopVisible: { type: "boolean", description: "Whether a connection loop or hole is actually visible at the top of the charm in the image." },
    needsReview: {
      type: "array",
      items: { type: "string" },
      description: "Plain-language list of anything about this concept that would need manufacturing review (fine detail, thin elements, unclear connection point, etc). Can be empty.",
    },
  },
  required: ["name", "designIntent", "connectionDescription", "loopVisible", "needsReview"],
};

const REQUEST_TIMEOUT_MS = 55_000; // stay under typical serverless function limits
const MAX_RETRIES = 1; // one retry only — image generation is slow and not free

async function callGeminiOnce(apiKey, model, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      const detail = await response.text();
      const err = new Error(`${model} request failed (${response.status}): ${detail.slice(0, 500)}`);
      err.status = response.status;
      throw err;
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/** Retries once on 429/5xx or timeout — never on 4xx (bad request won't fix itself). */
async function callGemini(apiKey, model, body) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callGeminiOnce(apiKey, model, body);
    } catch (err) {
      lastErr = err;
      const retryable = err.name === "AbortError" || !err.status || err.status === 429 || err.status >= 500;
      if (!retryable || attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

// In-memory per-instance rate limit — IMPLEMENTED BUT VERIFIED INEFFECTIVE:
// tested locally via `vercel dev` with 12 sequential requests from a fixed IP
// and NONE were throttled, meaning this module's in-memory state does not
// reliably survive between invocations in this serverless runtime (whether
// that's `vercel dev`'s emulation specifically or also true in production is
// unconfirmed without a deployed test). Left in place as a harmless no-cost
// best-effort layer, but do not rely on it. A real limit needs a shared store
// (a Supabase row/table keyed by authenticated user, Redis, Vercel KV, etc.)
// that isn't connected yet — see supabase/schema.sql. Until then, the only
// real protection against generation spam is the client-side single-in-flight
// guard in CharmDesignContext/Create.tsx, which is not abuse-proof.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const MAX_CONCURRENT = 3;
const requestLog = new Map(); // ip -> timestamps[]
let concurrentCount = 0;

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_PER_WINDOW) {
    requestLog.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return false;
}

// Set only on Preview (see vercel env ls) — Production has no PREVIEW_ACCESS_TOKEN,
// so this check is a no-op there. On Preview, every call must carry a matching
// X-Preview-Access header or it's rejected before the Gemini key is ever read,
// regardless of whether Vercel's own deployment protection also covers this
// route — see the session report for what was verified about that separately.
function requirePreviewAccess(req, res) {
  const required = process.env.PREVIEW_ACCESS_TOKEN;
  if (!required) return true; // not a preview deployment (or not configured) — no extra gate
  const provided = req.headers["x-preview-access"];
  if (provided !== required) {
    res.status(401).json({ error: "Preview access required." });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!requirePreviewAccess(req, res)) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(501).json({ error: "Charm generation is not configured." });
    return;
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Too many generations — please wait a few minutes and try again." });
    return;
  }
  if (concurrentCount >= MAX_CONCURRENT) {
    res.status(429).json({ error: "Generation is busy right now — please try again in a moment." });
    return;
  }

  const { brief, sourceImage, editOf } = req.body ?? {};
  if (!editOf && (!brief || typeof brief !== "object")) {
    res.status(400).json({ error: "Missing brief." });
    return;
  }
  if (editOf && (!editOf.imageDataUrl || !editOf.editRequestText)) {
    res.status(400).json({ error: "Missing editOf.imageDataUrl or editOf.editRequestText." });
    return;
  }

  concurrentCount++;
  try {
    // 1) Image generation or edit
    const imageParts = [];
    let promptText;
    if (editOf) {
      promptText = buildEditPrompt(editOf.editRequestText);
      const [, meta, data] = editOf.imageDataUrl.match(/^data:([^;]+);base64,(.+)$/) ?? [];
      if (data) imageParts.push({ inlineData: { mimeType: meta, data } });
    } else {
      promptText = buildImagePrompt(brief);
      if (sourceImage?.base64 && sourceImage?.mimeType) {
        imageParts.push({ inlineData: { mimeType: sourceImage.mimeType, data: sourceImage.base64 } });
      }
    }
    imageParts.unshift({ text: promptText });

    const imageResult = await callGemini(apiKey, IMAGE_MODEL, { contents: [{ parts: imageParts }] });
    const imagePart = imageResult?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!imagePart) {
      res.status(502).json({ error: "No concept image returned." });
      return;
    }
    const imageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

    // 2) Structured description of the image actually produced (separate model)
    let structured = null;
    try {
      const analysisResult = await callGemini(apiKey, ANALYSIS_MODEL, {
        contents: [
          {
            parts: [
              { text: "Describe this jewelry charm concept image for a production review summary." },
              { inlineData: { mimeType: imagePart.inlineData.mimeType, data: imagePart.inlineData.data } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", responseSchema: CONCEPT_SCHEMA },
      });
      const text = analysisResult?.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
      structured = text ? JSON.parse(text) : null;
    } catch {
      structured = null; // analysis is best-effort; the image result still stands on its own
    }

    const needsReview = Array.isArray(structured?.needsReview) ? structured.needsReview : [];
    if (!needsReview.includes(BASELINE_NEEDS_REVIEW)) needsReview.push(BASELINE_NEEDS_REVIEW);

    res.status(200).json({
      image: imageDataUrl,
      name: structured?.name ?? "Untitled concept",
      designIntent: structured?.designIntent ?? "",
      connectionDescription:
        structured?.connectionDescription ??
        "A connection loop was requested at the top of the design — not yet visually confirmed.",
      loopRequested: true,
      loopVisibleAccordingToModel: structured?.loopVisible ?? null,
      needsReview,
      imageModel: IMAGE_MODEL,
      analysisModel: structured ? ANALYSIS_MODEL : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Unexpected error.", detail: String(err) });
  } finally {
    concurrentCount--;
  }
}
