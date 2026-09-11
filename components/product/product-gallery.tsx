"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/cn";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  blurDataUrl: string;
};

/**
 * The thumbnail strip only appears when a product genuinely has more than one
 * photograph — the shop.co asset set ships one per garment, and repeating the
 * same image to fake a gallery would be worse than not having one.
 */
export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (!active) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-surface-muted text-sm text-ink-muted">
        No image available
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-3 sm:gap-4 lg:flex-row">
      {images.length > 1 ? (
        <ul className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible" role="list">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === activeIndex}
                className={cn(
                  "relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-surface-muted sm:w-24 lg:w-28",
                  index === activeIndex ? "ring-2 ring-ink" : "ring-1 ring-line",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  className="object-contain p-2"
                  sizes="112px"
                  placeholder="blur"
                  blurDataURL={image.blurDataUrl}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative aspect-square flex-1 overflow-hidden rounded-2xl bg-surface-muted">
        <Image
          key={active.id}
          src={active.url}
          alt={active.alt || name}
          fill
          priority
          className="object-contain p-6 sm:p-10"
          sizes="(min-width: 1024px) 45vw, 100vw"
          placeholder="blur"
          blurDataURL={active.blurDataUrl}
        />
      </div>
    </div>
  );
}
