export const SIGNATURE_FONTS = [
  { id: "dancing", label: "Elegant Script", family: "Dancing Script" },
  { id: "great-vibes", label: "Formal Script", family: "Great Vibes" },
  { id: "caveat", label: "Casual Hand", family: "Caveat" },
] as const;

export type SignatureFontId = (typeof SIGNATURE_FONTS)[number]["id"];

export type SignatureMethod = "drawn" | "uploaded" | "typed";

export function dataUrlToPngBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64, "base64");
}

const WHITE_THRESHOLD = 235;

function stripNearWhitePixels(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
      data[i + 3] = 0;
    }
  }
}

function trimTransparentCanvas(
  source: HTMLCanvasElement
): HTMLCanvasElement {
  const ctx = source.getContext("2d");
  if (!ctx) return source;

  const { width, height } = source;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX >= maxX || minY >= maxY) return source;

  const padding = 8;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width, maxX + padding);
  maxY = Math.min(height, maxY + padding);

  const trimmed = document.createElement("canvas");
  trimmed.width = maxX - minX;
  trimmed.height = maxY - minY;
  const tctx = trimmed.getContext("2d");
  if (!tctx) return source;

  tctx.drawImage(
    source,
    minX,
    minY,
    trimmed.width,
    trimmed.height,
    0,
    0,
    trimmed.width,
    trimmed.height
  );
  return trimmed;
}

/** Remove white backgrounds and crop empty margins for a clean transparent PNG. */
export async function normalizeSignatureDataUrl(
  dataUrl: string
): Promise<string> {
  if (typeof document === "undefined") return dataUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      stripNearWhitePixels(imageData.data);
      ctx.putImageData(imageData, 0, 0);

      const trimmed = trimTransparentCanvas(canvas);
      resolve(trimmed.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Could not load signature image"));
    img.src = dataUrl;
  });
}

export function renderTypedSignatureToDataUrl(
  text: string,
  fontFamily: string
): string {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 120;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f172a";
  ctx.font = `48px "${fontFamily}", cursive`;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 24, 60);

  return trimTransparentCanvas(canvas).toDataURL("image/png");
}
