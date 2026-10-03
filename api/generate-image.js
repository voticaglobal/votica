// Vercel serverless function. Keeps GEMINI_API_KEY server-side only —
// the client never sees it. Falls back gracefully (501) when unconfigured
// so the app still works in demo mode with no key set.
//
// No code in src/ calls this endpoint anymore (superseded by
// api/generate-charm-concept.js) — kept live for now rather than deleted, so
// it still needs the same preview gate as a cost-abuse vector in its own right.
function requirePreviewAccess(req, res) {
  const required = process.env.PREVIEW_ACCESS_TOKEN;
  if (!required) return true;
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
    res.status(501).json({ error: "Image generation is not configured." });
    return;
  }

  const { prompt, photoBase64, photoMimeType } = req.body ?? {};
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing prompt." });
    return;
  }

  const parts = [{ text: prompt }];
  if (photoBase64 && photoMimeType) {
    parts.push({ inlineData: { mimeType: photoMimeType, data: photoBase64 } });
  }

  try {
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contents: [{ parts }] }),
      },
    );

    if (!geminiResponse.ok) {
      const detail = await geminiResponse.text();
      res.status(502).json({ error: "Image generation failed.", detail: detail.slice(0, 500) });
      return;
    }

    const data = await geminiResponse.json();
    const imagePart = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);

    if (!imagePart) {
      res.status(502).json({ error: "No image returned." });
      return;
    }

    res.status(200).json({
      image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
    });
  } catch (err) {
    res.status(500).json({ error: "Unexpected error.", detail: String(err) });
  }
}
