import { BrandStrip } from "@/components/home/brand-strip";
import { DressStyleGrid } from "@/components/home/dress-style-grid";
import { Hero } from "@/components/home/hero";
import { ProductRail } from "@/components/home/product-rail";
import { TestimonialCarousel } from "@/components/home/testimonial-carousel";
import { getCollectionProducts, getDressStyleCards, getTestimonials } from "@/lib/products";

export default async function HomePage() {
  const [newArrivals, topSelling, styles, testimonials] = await Promise.all([
    getCollectionProducts("new-arrivals"),
    getCollectionProducts("top-selling"),
    getDressStyleCards(),
    getTestimonials(),
  ]);

  return (
    <>
      <Hero />
      <BrandStrip />
      <ProductRail
        title="New Arrivals"
        href="/shop/new-arrivals"
        products={newArrivals}
        priority
      />
      <ProductRail title="Top Selling" href="/shop/top-selling" products={topSelling} />
      <DressStyleGrid styles={styles} />
      <TestimonialCarousel testimonials={testimonials} />
    </>
  );
}
