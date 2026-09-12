"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CloseIcon } from "@/components/ui/icons";
import {
  ACCEPTED_IMAGE_LABEL,
  formatBytes,
  IMAGE_ACCEPT_ATTRIBUTE,
  MAX_IMAGE_BYTES,
} from "@/lib/images";
import type { VariantImage } from "@/lib/admin/product-draft";
import { cn } from "@/lib/cn";

/**
 * Downscales the chosen file to a handful of pixels and returns it as a data
 * URL, for next/image's `blurDataURL`.
 *
 * Done in the browser because the server has no image decoder — adding one just
 * to produce a placeholder would be a heavy dependency for a 12-pixel thumbnail.
 * The server validates the result before storing it.
 */
async function createBlurDataUrl(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = 12 / Math.max(bitmap.width, bitmap.height, 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const dataUrl = canvas.toDataURL("image/webp", 0.6);
    return dataUrl.startsWith("data:image/") ? dataUrl : null;
  } catch {
    // A browser without `createImageBitmap`, or a file it cannot decode. The
    // server substitutes a neutral placeholder.
    return null;
  }
}

type Props = {
  colorName: string;
  colorHex: string;
  image: VariantImage | null;
  error?: string;
  onChange: (image: VariantImage | null) => void;
  onError: (message: string | null) => void;
};

/**
 * Uploads and previews the photograph for one colour.
 *
 * The file is sent as soon as it is picked, so the preview shown is the stored
 * image rather than a local object URL — what the administrator approves on the
 * review step is exactly what the storefront will serve.
 */
export function VariantImageField({
  colorName,
  colorHex,
  image,
  error,
  onChange,
  onError,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    onError(null);

    if (file.size > MAX_IMAGE_BYTES) {
      onError(
        `That image is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_IMAGE_BYTES)}.`,
      );
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const blurDataUrl = await createBlurDataUrl(file);
      if (blurDataUrl) body.set("blurDataUrl", blurDataUrl);

      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const payload = (await response.json().catch(() => null)) as
        | { id: string; url: string; blurDataUrl: string; error?: string }
        | null;

      if (!response.ok || !payload?.id) {
        onError(payload?.error ?? "That image could not be uploaded. Please try again.");
        return;
      }

      onChange({
        assetId: payload.id,
        imageId: null,
        url: payload.url,
        blurDataUrl: payload.blurDataUrl,
      });
    } catch {
      onError("That image could not be uploaded. Check your connection and try again.");
    } finally {
      setUploading(false);
      // Lets the same file be picked again after a failure.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const describedBy = error ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={cn(
            "relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-muted",
            error ? "ring-2 ring-sale" : "ring-1 ring-line",
          )}
        >
          {image ? (
            <Image
              src={image.url}
              alt={`${colorName} variant preview`}
              fill
              className="object-contain p-1.5"
              sizes="96px"
              placeholder="blur"
              blurDataURL={image.blurDataUrl}
            />
          ) : (
            <span className="flex h-full items-center justify-center px-2 text-center text-xs text-ink-subtle">
              {uploading ? "Uploading…" : "No image"}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {/* The colour this file belongs to is named next to the control, so a
              multi-colour form cannot be filled in against the wrong row. */}
          <label htmlFor={inputId} className="flex items-center gap-2 text-sm font-medium">
            <span
              aria-hidden="true"
              style={{ backgroundColor: colorHex }}
              className="h-4 w-4 rounded-full ring-1 ring-inset ring-line-strong"
            />
            Image for {colorName}
            <span className="text-sale" aria-hidden="true">
              *
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={IMAGE_ACCEPT_ATTRIBUTE}
              disabled={uploading}
              aria-invalid={Boolean(error)}
              aria-describedby={describedBy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
              className={cn(
                "min-w-0 flex-1 text-xs text-ink-muted",
                "file:mr-3 file:min-h-9 file:cursor-pointer file:rounded-full file:border-0",
                "file:bg-ink file:px-4 file:text-sm file:font-medium file:text-on-ink",
                "hover:file:bg-ink/85 disabled:opacity-50",
              )}
            />

            {image ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange(null);
                  onError(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                <CloseIcon className="h-4 w-4" />
                Remove
              </Button>
            ) : null}
          </div>

          <p className="text-xs text-ink-subtle">
            {ACCEPTED_IMAGE_LABEL}, up to {formatBytes(MAX_IMAGE_BYTES)}.
            {image ? " Choose another file to replace it." : ""}
          </p>
        </div>
      </div>

      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-sale">
          {error}
        </p>
      ) : null}
    </div>
  );
}
