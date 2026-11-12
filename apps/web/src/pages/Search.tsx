import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { ProductGrid } from '../components/ProductGrid';
import type { Product } from '../types';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const [results, setResults] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    setResults(null);
    setError(null);
    api
      .search(q)
      .then(setResults)
      .catch((err) => setError(err.message ?? 'Search failed'));
  }, [q]);

  return (
    <section>
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Search results</h1>
        {q && (
          <p className="text-sm text-slate-600">
            Results for <span className="font-medium">&ldquo;{q}&rdquo;</span>
          </p>
        )}
      </header>
      {!q && <p className="text-slate-600">Enter a search term above.</p>}
      {error && <p className="text-red-700">{error}</p>}
      {q && !error && results === null && <p className="text-slate-600">Searching...</p>}
      {results !== null && (
        <ProductGrid
          products={results}
          emptyLabel={q ? 'No products matched your search.' : 'No results.'}
        />
      )}
    </section>
  );
}
