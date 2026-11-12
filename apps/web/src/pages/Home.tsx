import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ProductGrid } from '../components/ProductGrid';
import type { Product } from '../types';

export function HomePage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getFeatured()
      .then(setProducts)
      .catch((err) => setError(err.message ?? 'Failed to load featured products'));
  }, []);

  return (
    <section>
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Top rated products</h1>
        <p className="text-sm text-slate-600">Hand-picked favourites from the catalogue.</p>
      </header>
      {error && <p className="text-red-700">{error}</p>}
      {!error && products === null && <p className="text-slate-600">Loading...</p>}
      {products !== null && <ProductGrid products={products} featured />}
    </section>
  );
}
