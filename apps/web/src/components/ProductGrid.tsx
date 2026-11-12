import type { Product } from '../types';
import { ProductCard } from './ProductCard';

interface Props {
  products: Product[];
  featured?: boolean;
  emptyLabel?: string;
}

export function ProductGrid({ products, featured, emptyLabel }: Props) {
  if (products.length === 0) {
    return <p className="text-slate-600">{emptyLabel ?? 'No products.'}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} featured={featured} />
      ))}
    </div>
  );
}
