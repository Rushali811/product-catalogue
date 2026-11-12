import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function SearchBar() {
  const [params] = useSearchParams();
  const [term, setTerm] = useState(params.get('q') ?? '');
  const navigate = useNavigate();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={onSubmit} role="search" className="flex w-full max-w-md gap-2">
      <input
        type="search"
        aria-label="Search products"
        placeholder="Search products..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <button
        type="submit"
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
      >
        Search
      </button>
    </form>
  );
}
