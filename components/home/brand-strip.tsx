import Image from "next/image";

import { BRANDS } from "@/lib/constants";

export function BrandStrip() {
  return (
    <section aria-label="Brands we stock" className="bg-ink">
      <div className="container-page flex flex-wrap items-center justify-center gap-x-10 gap-y-6 py-7 sm:justify-between sm:gap-x-6 lg:py-11">
        {BRANDS.map((brand) => (
          <Image
            key={brand.name}
            src={brand.src}
            alt={brand.name}
            width={brand.width}
            height={brand.height}
            // The logo files are baked #FFFFFF for the black strip. The strip
            // turns light in dark mode, so the monochrome artwork is inverted
            // to black rather than shipping a second set of files.
            className="h-5 w-auto invert-0 sm:h-6 lg:h-8 dark:invert"
          />
        ))}
      </div>
    </section>
  );
}
