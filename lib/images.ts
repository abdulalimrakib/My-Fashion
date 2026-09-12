/**
 * Validation for images uploaded through the admin.
 *
 * The dimensions and the real media type are read out of the file's own bytes
 * rather than taken from the browser's `File.type`, which is attacker-supplied
 * and is wrong often enough to matter even when it is not. Parsing three
 * container headers is a few dozen lines; an image library would be a far
 * heavier dependency for the same answer.
 */

/** Largest single upload. Product cut-outs in `public/` are 30-80 KB. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** Rejects icons and stray screenshots that would render as a blurred mess. */
export const MIN_IMAGE_DIMENSION = 200;

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/** The `accept` attribute for the file input, kept next to the server's rule. */
export const IMAGE_ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",");

export const ACCEPTED_IMAGE_LABEL = "PNG, JPEG or WebP";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type SniffedImage = {
  mimeType: (typeof ACCEPTED_IMAGE_TYPES)[number];
  width: number;
  height: number;
};

function sniffPng(view: DataView): SniffedImage | null {
  // 8-byte signature, then a length + "IHDR" chunk whose first two fields are
  // the dimensions.
  if (view.byteLength < 24) return null;
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < signature.length; i += 1) {
    if (view.getUint8(i) !== signature[i]) return null;
  }
  if (String.fromCharCode(...readAscii(view, 12, 4)) !== "IHDR") return null;
  return { mimeType: "image/png", width: view.getUint32(16), height: view.getUint32(20) };
}

/** Start-of-frame markers; every other marker carries a length to skip over. */
const JPEG_SOF = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function sniffJpeg(view: DataView): SniffedImage | null {
  if (view.byteLength < 4) return null;
  if (view.getUint8(0) !== 0xff || view.getUint8(1) !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null;
    const marker = view.getUint8(offset + 1);

    // Padding byte, and the standalone markers that carry no payload.
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    if (JPEG_SOF.has(marker)) {
      return {
        mimeType: "image/jpeg",
        height: view.getUint16(offset + 5),
        width: view.getUint16(offset + 7),
      };
    }
    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}

function sniffWebp(view: DataView): SniffedImage | null {
  // "RIFF" <size> "WEBP" <chunk fourcc> — the dimensions live in the chunk, and
  // each of the three chunk kinds stores them differently.
  if (view.byteLength < 30) return null;
  if (String.fromCharCode(...readAscii(view, 0, 4)) !== "RIFF") return null;
  if (String.fromCharCode(...readAscii(view, 8, 4)) !== "WEBP") return null;

  const chunk = String.fromCharCode(...readAscii(view, 12, 4));

  if (chunk === "VP8 ") {
    // Lossy: a 3-byte start code, then 14-bit width and height.
    if (view.getUint8(23) !== 0x9d || view.getUint8(24) !== 0x01 || view.getUint8(25) !== 0x2a) {
      return null;
    }
    return {
      mimeType: "image/webp",
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    };
  }

  if (chunk === "VP8L") {
    // Lossless: a signature byte, then 14 bits of width and 14 of height minus
    // one, packed little-endian across the next four bytes.
    if (view.getUint8(20) !== 0x2f) return null;
    const bits = view.getUint32(21, true);
    return {
      mimeType: "image/webp",
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  if (chunk === "VP8X") {
    // Extended: 24-bit canvas width and height minus one.
    const width = view.getUint8(24) | (view.getUint8(25) << 8) | (view.getUint8(26) << 16);
    const height = view.getUint8(27) | (view.getUint8(28) << 8) | (view.getUint8(29) << 16);
    return { mimeType: "image/webp", width: width + 1, height: height + 1 };
  }

  return null;
}

function readAscii(view: DataView, offset: number, length: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < length; i += 1) out.push(view.getUint8(offset + i));
  return out;
}

/**
 * Reads the real media type and pixel dimensions out of an image's own header.
 * Returns null when the bytes are not one of the accepted formats — which
 * doubles as the content-type check, since a renamed `.exe` never parses.
 */
export function sniffImage(bytes: Uint8Array): SniffedImage | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const result = sniffPng(view) ?? sniffJpeg(view) ?? sniffWebp(view);
  if (!result) return null;
  if (!Number.isInteger(result.width) || !Number.isInteger(result.height)) return null;
  if (result.width <= 0 || result.height <= 0) return null;
  return result;
}

/** Neutral grey, used only when the browser could not produce a real one. */
export const FALLBACK_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/** A blur placeholder is a data URL, so cap it and check the prefix it claims. */
const BLUR_DATA_URL = /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;
const MAX_BLUR_DATA_URL_LENGTH = 4000;

export function isValidBlurDataUrl(value: string): boolean {
  return value.length <= MAX_BLUR_DATA_URL_LENGTH && BLUR_DATA_URL.test(value);
}

/** The public path an uploaded asset is served from. */
export function imageAssetUrl(assetId: string): string {
  return `/api/images/${assetId}`;
}

export type ImageValidationError = { message: string };

/**
 * The single gate every upload passes through, shared by the route handler and
 * its tests.
 */
export function validateImageBytes(
  bytes: Uint8Array,
): { ok: true; image: SniffedImage } | { ok: false; error: ImageValidationError } {
  if (bytes.byteLength === 0) {
    return { ok: false, error: { message: "That file is empty." } };
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: {
        message: `That image is ${formatBytes(bytes.byteLength)}. The limit is ${formatBytes(MAX_IMAGE_BYTES)}.`,
      },
    };
  }

  const image = sniffImage(bytes);
  if (!image) {
    return {
      ok: false,
      error: { message: `That file is not a valid image. Upload a ${ACCEPTED_IMAGE_LABEL} file.` },
    };
  }
  if (image.width < MIN_IMAGE_DIMENSION || image.height < MIN_IMAGE_DIMENSION) {
    return {
      ok: false,
      error: {
        message: `That image is ${image.width}x${image.height}. It must be at least ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION} pixels.`,
      },
    };
  }

  return { ok: true, image };
}
