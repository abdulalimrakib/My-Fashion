import Image from "next/image";
import Link from "next/link";

import { PriceTag } from "@/components/ui/price-tag";
import { StarRating } from "@/components/ui/star-rating";
import type { ProductCardData } from "@/lib/products";
import { cn } from "@/lib/cn";

type Props = {
  product: ProductCardData;
  className?: string;
  /** Set on the few cards above the fold so they are not lazy-loaded. */
  priority?: boolean;
  sizes?: string;
};

export function ProductCard({ product, className, priority, sizes }: Props) {
  const image = product.images[0];

  return (
    <article className={cn("group flex flex-col gap-3", className)}>
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-2xl bg-surface-muted"
        tabIndex={-1}
        aria-hidden="true"
      >
        {image ? (
          <Image
            src={image.url}
            alt=""
            fill
            // Cut-outs are padded and contained so nothing is ever cropped or stretched.
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105 sm:p-6"
            sizes={sizes ?? "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"}
            placeholder="blur"
            blurDataURL={image.blurDataUrl}
            priority={priority}
          />
        ) : null}
      </Link>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold leading-snug sm:text-lg">
          <Link href={`/product/${product.slug}`} className="hover:underline underline-offset-4">
            {product.name}
          </Link>
        </h3>
        <StarRating value={product.rating} />
        <PriceTag
          priceCents={product.priceCents}
          compareAtPriceCents={product.compareAtPriceCents}
        />
      </div>
    </article>
  );
}
