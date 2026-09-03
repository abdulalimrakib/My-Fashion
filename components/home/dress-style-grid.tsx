import Image from "next/image";
import Link from "next/link";

import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";

type StyleCard = {
  slug: string;
  name: string;
  image: { url: string; blurDataUrl: string } | null;
};

/**
 * The reference design uses lifestyle photography here, which the shop.co asset
 * set does not include. Each card instead shows a representative garment from
 * that style — real catalogue imagery rather than a placeholder.
 */
export function DressStyleGrid({ styles }: { styles: StyleCard[] }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="container-page">
        <div className="space-y-9 rounded-3xl bg-surface-sunken px-6 py-10 sm:px-12 sm:py-14">
          <SectionHeading>Browse by dress style</SectionHeading>

          <ul className="grid gap-4 sm:gap-5 lg:grid-cols-3">
            {styles.map((style, index) => (
              // Alternating spans reproduce the reference's 1:2 / 2:1 rhythm.
              <li
                key={style.slug}
                className={cn(index % 4 === 0 || index % 4 === 3 ? "lg:col-span-1" : "lg:col-span-2")}
              >
                <Link
                  href={`/shop?style=${style.slug}`}
                  className="group relative flex h-44 items-center overflow-hidden rounded-2xl bg-surface px-6 sm:h-48"
                >
                  <span className="relative z-10 text-2xl font-bold sm:text-3xl">{style.name}</span>
                  {style.image ? (
                    <Image
                      src={style.image.url}
                      alt=""
                      aria-hidden="true"
                      width={300}
                      height={300}
                      sizes="(min-width: 1024px) 24rem, 60vw"
                      placeholder="blur"
                      blurDataURL={style.image.blurDataUrl}
                      className="absolute -right-4 bottom-0 h-[115%] w-auto max-w-[60%] object-contain object-bottom transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
