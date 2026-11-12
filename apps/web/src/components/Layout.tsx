import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { api } from '../api/client';
import { SearchBar } from './SearchBar';

export function Layout() {
  const [categories, setCategories] = useState<string[]>([]);
  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-slate-900">
            Catalogue
          </Link>
          <SearchBar />
        </div>
        {categories.length > 0 && (
          <nav aria-label="Categories" className="border-t border-slate-100 bg-slate-50">
            <ul className="mx-auto flex max-w-6xl flex-wrap gap-4 px-4 py-2 text-sm">
              {categories.map((c) => (
                <li key={c}>
                  <Link
                    to={`/categories/${encodeURIComponent(c)}`}
                    className="capitalize text-slate-700 hover:text-indigo-700"
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Product Catalogue PoC
      </footer>
    </div>
  );
}
