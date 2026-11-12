import type { Product, ProductRepository } from './ProductRepository.js';

/**
 * Adapter over the public Fake Store API.
 *
 * Design notes:
 * - All reads go through listAll() so we have a single cache for the entire catalogue.
 *   The catalogue is tiny (~20 items) and the upstream is slow + rate-limited, so
 *   caching once and filtering in-process is faster and kinder than hitting upstream
 *   for every query.
 * - Cache is a time-boxed single Promise so concurrent requests coalesce into one
 *   upstream call (basic "singleflight").
 * - Only the shape we actually need is mapped into our domain Product.
 */
export interface FakeStoreRepositoryOptions {
  baseUrl: string;
  cacheTtlMs: number;
  fetchImpl?: typeof fetch;
}

interface CacheEntry {
  expiresAt: number;
  promise: Promise<Product[]>;
}

export class FakeStoreRepository implements ProductRepository {
  private cache: CacheEntry | null = null;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: FakeStoreRepositoryOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async listAll(): Promise<Product[]> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) {
      return this.cache.promise;
    }
    const promise = this.fetchAll();
    this.cache = { expiresAt: now + this.opts.cacheTtlMs, promise };
    // Invalidate the cache on failure so the next call retries upstream.
    promise.catch(() => {
      if (this.cache?.promise === promise) this.cache = null;
    });
    return promise;
  }

  async getById(id: number): Promise<Product | null> {
    const all = await this.listAll();
    return all.find((p) => p.id === id) ?? null;
  }

  async listCategories(): Promise<string[]> {
    const all = await this.listAll();
    return [...new Set(all.map((p) => p.category))].sort();
  }

  async listByCategory(category: string): Promise<Product[]> {
    const all = await this.listAll();
    const needle = category.toLowerCase();
    return all.filter((p) => p.category.toLowerCase() === needle);
  }

  async search(term: string): Promise<Product[]> {
    const q = term.trim().toLowerCase();
    if (!q) return [];
    const all = await this.listAll();
    return all.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }

  async listFeatured(ids: number[]): Promise<Product[]> {
    const all = await this.listAll();
    const byId = new Map(all.map((p) => [p.id, p] as const));
    // Preserve the order the entrepreneur chose.
    return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
  }

  async listFeaturedInCategory(category: string, ids: number[]): Promise<Product[]> {
    const inCategory = await this.listByCategory(category);
    const allowed = new Set(inCategory.map((p) => p.id));
    const featured = await this.listFeatured(ids);
    return featured.filter((p) => allowed.has(p.id));
  }

  private async fetchAll(): Promise<Product[]> {
    const url = `${this.opts.baseUrl.replace(/\/$/, '')}/products`;
    const res = await this.fetchImpl(url);
    if (!res.ok) {
      throw new Error(`Upstream product API returned ${res.status}`);
    }
    const raw = (await res.json()) as unknown;
    if (!Array.isArray(raw)) {
      throw new Error('Upstream product API did not return an array');
    }
    return raw.map(toProduct);
  }
}

function toProduct(raw: unknown): Product {
  const r = raw as Record<string, unknown>;
  const rating = (r.rating ?? {}) as Record<string, unknown>;
  return {
    id: Number(r.id),
    title: String(r.title ?? ''),
    description: String(r.description ?? ''),
    price: Number(r.price ?? 0),
    category: String(r.category ?? ''),
    image: String(r.image ?? ''),
    rating: {
      rate: Number(rating.rate ?? 0),
      count: Number(rating.count ?? 0),
    },
  };
}
