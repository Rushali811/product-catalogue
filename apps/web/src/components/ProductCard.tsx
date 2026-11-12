import { Link } from 'react-router-dom';
import type { Product } from '../types';

interface Props {
  product: Product;
  featured?: boolean;
}

export function ProductCard({ product, featured }: Props) {
  return (
    <Link
      to={`/products/${product.id}`}
      data-testid="product-card"
      className="group flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {featured && (
        <span className="mb-2 inline-block w-fit rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          Top rated
        </span>
      )}
      <div className="flex h-40 items-center justify-center overflow-hidden rounded bg-slate-50">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
        {product.title}
      </h3>
      <p className="mt-auto pt-2 text-base font-semibold text-slate-900">
        ${product.price.toFixed(2)}
      </p>
    </Link>
  );
}
