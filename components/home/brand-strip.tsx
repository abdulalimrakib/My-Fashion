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
            className="h-5 w-auto sm:h-6 lg:h-8"
          />
        ))}
      </div>
    </section>
  );
}
