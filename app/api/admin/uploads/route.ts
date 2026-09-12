import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  ACCEPTED_IMAGE_LABEL,
  FALLBACK_BLUR_DATA_URL,
  imageAssetUrl,
  isValidBlurDataUrl,
  MAX_IMAGE_BYTES,
  validateImageBytes,
} from "@/lib/images";

/**
 * Receives one image from the admin product form and stores it as an
 * `ImageAsset`, returning the URL it will be served from.
 *
 * This is a Route Handler rather than a Server Action because Server Actions
 * are capped at a 1 MB request body by default: raising that limit globally to
 * fit several photographs in one submit would apply to every action in the app.
 * Uploading each file on its own as the admin picks it also means the preview
 * appears immediately and the final submit carries nothing but ids.
 */
export async function POST(request: Request) {
  const actor = await requireAdmin();
  if (!actor) {
    return Response.json({ error: "Not authorized." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMAGE_BYTES * 2) {
    return Response.json({ error: "That image is too large." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "That upload could not be read." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose an image file to upload." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  // The browser's reported MIME type is not consulted: the real type and the
  // dimensions are read out of the file's own header.
  const validation = validateImageBytes(bytes);
  if (!validation.ok) {
    return Response.json({ error: validation.error.message }, { status: 400 });
  }

  // The blur placeholder is downscaled from the same file by the browser, since
  // decoding an image server-side would mean adding an image library. It is
  // only ever used as next/image's `blurDataURL`, and it is checked here before
  // being stored.
  const submittedBlur = String(form.get("blurDataUrl") ?? "");
  const blurDataUrl = isValidBlurDataUrl(submittedBlur) ? submittedBlur : FALLBACK_BLUR_DATA_URL;

  const asset = await prisma.imageAsset.create({
    data: {
      mimeType: validation.image.mimeType,
      bytes: Buffer.from(bytes),
      byteSize: bytes.byteLength,
      width: validation.image.width,
      height: validation.image.height,
      blurDataUrl,
    },
    select: { id: true, width: true, height: true, blurDataUrl: true, byteSize: true },
  });

  return Response.json({
    id: asset.id,
    url: imageAssetUrl(asset.id),
    width: asset.width,
    height: asset.height,
    blurDataUrl: asset.blurDataUrl,
    byteSize: asset.byteSize,
    accepted: ACCEPTED_IMAGE_LABEL,
  });
}
