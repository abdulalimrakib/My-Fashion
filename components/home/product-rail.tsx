import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import type { ProductCardData } from "@/lib/products";

type Props = {
  title: string;
  href: string;
  products: ProductCardData[];
  priority?: boolean;
};

/**
 * Scrolls horizontally below `lg` so cards keep their full size and the cut-off
 * edge signals there is more to see; becomes a four-up grid on wide screens.
 */
export function ProductRail({ title, href, products, priority }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="border-b border-line py-12 last:border-b-0 sm:py-16">
      <div className="container-page space-y-8">
        <SectionHeading>{title}</SectionHeading>

        <ul className="rail-scroll -mx-4 px-4 xs:-mx-6 xs:px-6 md:-mx-16 md:px-16 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0 lg:[contain:none]">
          {products.map((product, index) => (
            <li key={product.id} className="w-[13.5rem] sm:w-64 lg:w-auto">
              <ProductCard
                product={product}
                priority={priority && index < 2}
                sizes="(min-width: 1024px) 22vw, 16rem"
              />
            </li>
          ))}
        </ul>

        <div className="flex justify-center">
          <ButtonLink href={href} variant="secondary" size="lg" className="w-full sm:w-56">
            View All
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
