import type { CategoryPageData, EnquiryInput, Product } from '../types';

/**
 * Thin typed wrapper around the backend. The client never knows about Fake Store —
 * all routes live on our own API, which is the contract we can grow.
 */
const BASE = import.meta.env.VITE_API_URL ?? '';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  async getFeatured(): Promise<Product[]> {
    const data = await get<{ products: Product[] }>('/api/products/featured');
    return data.products;
  },
  async getCategories(): Promise<string[]> {
    const data = await get<{ categories: string[] }>('/api/categories');
    return data.categories;
  },
  async getCategory(category: string): Promise<CategoryPageData> {
    return get<CategoryPageData>(
      `/api/categories/${encodeURIComponent(category)}/products`,
    );
  },
  async search(q: string): Promise<Product[]> {
    const data = await get<{ products: Product[] }>(
      `/api/products/search?q=${encodeURIComponent(q)}`,
    );
    return data.products;
  },
  async getProduct(id: number): Promise<Product> {
    const data = await get<{ product: Product }>(`/api/products/${id}`);
    return data.product;
  },
  async submitEnquiry(input: EnquiryInput): Promise<void> {
    const res = await fetch(`${BASE}/api/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new ApiError(res.status, body.error ?? 'Could not submit enquiry');
    }
  },
};
