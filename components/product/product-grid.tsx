import { ProductCard } from "@/components/product/product-card";
import type { ProductCardData } from "@/lib/products";

type Props = {
  products: ProductCardData[];
  priorityCount?: number;
};

export function ProductGrid({ products, priorityCount = 0 }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
