import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { ProductGrid } from '../components/ProductGrid';
import type { CategoryPageData } from '../types';

export function CategoryPage() {
  const { category = '' } = useParams();
  const [data, setData] = useState<CategoryPageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api
      .getCategory(category)
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError('That category could not be found.');
        } else {
          setError(err.message ?? 'Failed to load category');
        }
      });
  }, [category]);

  return (
    <section>
      <header className="mb-4">
        <h1 className="text-2xl font-bold capitalize text-slate-900">{category}</h1>
      </header>
      {error && <p className="text-red-700">{error}</p>}
      {!error && data === null && <p className="text-slate-600">Loading...</p>}
      {data && (
        <>
          {data.featured.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Top rated</h2>
              <ProductGrid products={data.featured} featured />
            </div>
          )}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              {data.featured.length > 0 ? 'More in this category' : 'All products'}
            </h2>
            <ProductGrid
              products={data.additional}
              emptyLabel="No additional products in this category."
            />
          </div>
        </>
      )}
    </section>
  );
}
