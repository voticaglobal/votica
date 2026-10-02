const ALPHA_CAPABLE_TYPES = new Set(["image/png", "image/webp", "image/gif"]);

/**
 * Downscales an uploaded photo to a compressed data URL before it's sent anywhere
 * (API calls, localStorage). Keeps PNG (with any real alpha transparency intact)
 * for PNG/WebP/GIF sources — a customer who uploads their own pre-cut-out charm
 * art must not have that transparency silently flattened to JPEG's opaque white.
 * Everything else (photos) compresses to JPEG as before.
 */
export function fileToDataUrl(file: File, maxDim = 768, quality = 0.85): Promise<string> {
  const preserveAlpha = ALPHA_CAPABLE_TYPES.has(file.type);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d", preserveAlpha ? { alpha: true } : undefined);
        if (!ctx) {
          reject(new Error("Canvas unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(preserveAlpha ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** True if the image already carries real alpha transparency (a pre-cut-out upload), not just an opaque photo. */
export function hasAlphaTransparency(dataUrl: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("Could not decode image"));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(false);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) {
          resolve(true);
          return;
        }
      }
      resolve(false);
    };
    img.src = dataUrl;
  });
}

export function dataUrlToParts(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

/**
 * Gemini's image model can't output real alpha transparency — it just paints
 * whatever background it's asked for (including a literal checkerboard if you
 * ask for "transparent"). This flood-fills from the four corners, turning any
 * background-colored region connected to the edge into real transparency, so
 * a charm generated on a plain white background can be clipped into a small
 * circle without a white square showing behind it.
 */
export function cutoutBackground(dataUrl: string, threshold = 28): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("Could not decode image"));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0);

      const { width, height } = canvas;
      const imageData = ctx.getImageData(0, 0, width, height);
      const { data } = imageData;
      const pixelCount = width * height;
      const visited = new Uint8Array(pixelCount);

      const byteIndex = (pixel: number) => pixel * 4;
      const colorDistance = (pixel: number, r: number, g: number, b: number) => {
        const i = byteIndex(pixel);
        const dr = data[i] - r;
        const dg = data[i + 1] - g;
        const db = data[i + 2] - b;
        return Math.sqrt(dr * dr + dg * dg + db * db);
      };

      const cornerPixels = [0, width - 1, (height - 1) * width, height * width - 1];
      let br = 0;
      let bg = 0;
      let bb = 0;
      for (const p of cornerPixels) {
        const i = byteIndex(p);
        br += data[i];
        bg += data[i + 1];
        bb += data[i + 2];
      }
      br /= cornerPixels.length;
      bg /= cornerPixels.length;
      bb /= cornerPixels.length;

      const stack: number[] = [...cornerPixels];
      while (stack.length) {
        const p = stack.pop() as number;
        if (visited[p]) continue;
        visited[p] = 1;
        if (colorDistance(p, br, bg, bb) > threshold) continue;

        data[byteIndex(p) + 3] = 0;

        const x = p % width;
        const y = (p / width) | 0;
        if (x > 0) stack.push(p - 1);
        if (x < width - 1) stack.push(p + 1);
        if (y > 0) stack.push(p - width);
        if (y < height - 1) stack.push(p + width);
      }

      ctx.putImageData(imageData, 0, 0);

      // Gemini often leaves the subject small in the middle of a much larger canvas
      // (margin, a drawn chain/bail we don't need since we render our own jump ring).
      // Crop to the tight bounding box of what's left opaque, so the subject actually
      // fills the small circle it gets clipped into downstream.
      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (data[byteIndex(y * width + x) + 3] > 10) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX < minX || maxY < minY) {
        resolve(canvas.toDataURL("image/png"));
        return;
      }

      const contentWidth = maxX - minX + 1;
      const contentHeight = maxY - minY + 1;
      const side = Math.max(contentWidth, contentHeight) * 1.18; // pad ~18% so nothing touches the eventual circular clip edge
      const cx = minX + contentWidth / 2;
      const cy = minY + contentHeight / 2;

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = side;
      cropCanvas.height = side;
      const cropCtx = cropCanvas.getContext("2d");
      if (!cropCtx) {
        resolve(canvas.toDataURL("image/png"));
        return;
      }
      cropCtx.drawImage(canvas, cx - side / 2, cy - side / 2, side, side, 0, 0, side, side);
      resolve(cropCanvas.toDataURL("image/png"));
    };
    img.src = dataUrl;
  });
}
