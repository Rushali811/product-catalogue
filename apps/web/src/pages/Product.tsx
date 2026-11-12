import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { EnquiryForm } from '../components/EnquiryForm';
import type { Product } from '../types';

export function ProductPage() {
  const { id } = useParams();
  const productId = Number(id);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEnquiry, setShowEnquiry] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(productId) || productId <= 0) {
      setError('Invalid product id.');
      return;
    }
    setProduct(null);
    setError(null);
    setShowEnquiry(false);
    api
      .getProduct(productId)
      .then(setProduct)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError('Product not found.');
        } else {
          setError(err.message ?? 'Failed to load product');
        }
      });
  }, [productId]);

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-red-700">{error}</p>
        <Link to="/" className="text-indigo-700 hover:underline">
          ← Back to home
        </Link>
      </div>
    );
  }
  if (!product) return <p className="text-slate-600">Loading...</p>;

  return (
    <article className="grid gap-8 lg:grid-cols-2">
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-6">
        <img
          src={product.image}
          alt={product.title}
          className="max-h-[480px] max-w-full object-contain"
        />
      </div>
      <div>
        <Link
          to={`/categories/${encodeURIComponent(product.category)}`}
          className="inline-block text-sm capitalize text-indigo-700 hover:underline"
        >
          {product.category}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{product.title}</h1>
        <p className="mt-2 text-xl font-semibold text-slate-900">
          ${product.price.toFixed(2)}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-slate-700">{product.description}</p>
        <p className="mt-2 text-xs text-slate-500">
          Rating: {product.rating.rate} ({product.rating.count} reviews)
        </p>

        <div className="mt-6">
          {!showEnquiry ? (
            <button
              type="button"
              onClick={() => setShowEnquiry(true)}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Enquire
            </button>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Enquire about this product
              </h2>
              <EnquiryForm productId={product.id} productTitle={product.title} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
