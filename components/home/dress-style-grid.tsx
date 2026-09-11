import Image from "next/image";
import Link from "next/link";

import { SectionHeading } from "@/components/ui/section-heading";
import { DRESS_STYLE_IMAGES } from "@/lib/constants";
import { cn } from "@/lib/cn";

type StyleCard = {
  slug: string;
  name: string;
};

export function DressStyleGrid({ styles }: { styles: StyleCard[] }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="container-page">
        <div className="space-y-9 rounded-3xl bg-surface-sunken px-6 py-10 sm:px-12 sm:py-14">
          <SectionHeading>Browse by dress style</SectionHeading>

          {/* Two up from `sm`: a single column of full-width cards turns the
              portrait photographs into letterboxed face crops, because a wider
              card shows proportionally less of the image's height. */}
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {styles.map((style, index) => {
              const art = DRESS_STYLE_IMAGES[style.slug];

              return (
                // Alternating spans reproduce the reference's 1:2 / 2:1 rhythm.
                <li
                  key={style.slug}
                  className={cn(
                    index % 4 === 0 || index % 4 === 3 ? "lg:col-span-1" : "lg:col-span-2",
                  )}
                >
                  <Link
                    href={`/shop?style=${style.slug}`}
                    className="group relative flex h-56 items-start overflow-hidden rounded-2xl bg-surface-muted p-6 sm:h-64 lg:h-72"
                  >
                    {art ? (
                      <Image
                        src={art.src}
                        alt=""
                        aria-hidden="true"
                        fill
                        // Photographs, not cut-outs: they fill the card and are
                        // cropped, with the focal point set per image.
                        style={{ objectPosition: art.objectPosition }}
                        sizes="(min-width: 1024px) 40vw, (min-width: 640px) 90vw, 100vw"
                        placeholder="blur"
                        blurDataURL={art.blurDataURL}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : null}

                    {/* The label sits on a photograph, which does not change
                        with the theme — so neither does its treatment. A fixed
                        white wash keeps the name legible over every crop
                        without darkening the airy look of the reference, and it
                        clears well before the middle so it never veils a face. */}
                    {art ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-r from-white from-0% via-white/55 via-28% to-transparent to-58%"
                      />
                    ) : null}

                    <span
                      className={cn(
                        "relative z-10 text-2xl font-bold sm:text-3xl",
                        art ? "text-black" : "text-ink",
                      )}
                    >
                      {style.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
