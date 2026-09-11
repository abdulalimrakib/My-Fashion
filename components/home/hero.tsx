import Image from "next/image";

import { ButtonLink } from "@/components/ui/button";

const STATS = [
  { value: "200+", label: "International Brands" },
  { value: "2,000+", label: "High-Quality Products" },
  { value: "30,000+", label: "Happy Customers" },
];

export function Hero() {
  return (
    <section className="bg-surface-sunken">
      <div className="container-page grid gap-8 pt-10 lg:grid-cols-2 lg:gap-6 lg:pt-16">
        <div className="flex flex-col justify-center gap-6 pb-8 lg:pb-20">
          <h1 className="font-display text-4xl uppercase leading-[1.05] text-balance sm:text-5xl lg:text-6xl">
            Find clothes that match your style
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-ink-muted sm:text-base">
            Browse through our diverse range of meticulously crafted garments, designed to bring
            out your individuality and cater to your sense of style.
          </p>
          <ButtonLink href="/shop" size="lg" className="w-full sm:w-52">
            Shop Now
          </ButtonLink>

          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 sm:divide-x sm:divide-line">
            {STATS.map((stat, index) => (
              <div key={stat.label} className={index > 0 ? "sm:pl-6" : undefined}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block text-2xl font-bold sm:text-3xl lg:text-4xl">
                    {stat.value}
                  </span>
                  <span className="block text-xs text-ink-muted sm:text-sm">{stat.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative flex items-end justify-center lg:justify-end">
          {/* Decorative sparkles, sized from the same 104×80 vector. The file
              is `fill="currentColor"`, but an <img> is its own document and
              cannot inherit the page's colour, so it always paints black and
              has to be inverted for the dark hero. */}
          <Image
            src="/images/hero/star.svg"
            alt=""
            aria-hidden="true"
            width={104}
            height={80}
            className="absolute right-2 top-4 z-10 w-12 sm:right-4 sm:w-20 lg:top-10 lg:w-28 dark:invert"
          />
          <Image
            src="/images/hero/star.svg"
            alt=""
            aria-hidden="true"
            width={104}
            height={80}
            className="absolute left-0 top-1/3 z-10 w-7 sm:w-10 lg:w-14 dark:invert"
          />
          <Image
            src="/images/hero/hero-couple.png"
            alt="A man and a woman wearing denim jackets over white hoodies"
            width={390}
            height={496}
            priority
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="h-auto w-full max-w-[390px] object-contain lg:max-w-none"
          />
        </div>
      </div>
    </section>
  );
}
