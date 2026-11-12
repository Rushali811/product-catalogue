import { describe, it, expect, vi } from 'vitest';
import { FakeStoreRepository } from '../src/repositories/FakeStoreRepository.js';
import { sampleProducts } from './helpers.js';

function mockFetch(payload: unknown, ok = true, status = 200) {
  const fn = vi.fn(async () =>
    ({
      ok,
      status,
      json: async () => payload,
    }) as unknown as Response,
  );
  return fn;
}

describe('FakeStoreRepository', () => {
  it('maps upstream payload into domain products', async () => {
    const fetchImpl = mockFetch(sampleProducts);
    const repo = new FakeStoreRepository({
      baseUrl: 'http://fake',
      cacheTtlMs: 1000,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const all = await repo.listAll();
    expect(all).toHaveLength(sampleProducts.length);
    expect(all[0]!.title).toBe('Red Backpack');
  });

  it('caches results within the TTL (single upstream call for concurrent reads)', async () => {
    const fetchImpl = mockFetch(sampleProducts);
    const repo = new FakeStoreRepository({
      baseUrl: 'http://fake',
      cacheTtlMs: 10_000,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await Promise.all([repo.listAll(), repo.listAll(), repo.getById(1), repo.listCategories()]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('throws when upstream returns non-OK and does not poison the cache', async () => {
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      if (calls === 1) return { ok: false, status: 503, json: async () => ({}) } as unknown as Response;
      return { ok: true, status: 200, json: async () => sampleProducts } as unknown as Response;
    });
    const repo = new FakeStoreRepository({
      baseUrl: 'http://fake',
      cacheTtlMs: 10_000,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(repo.listAll()).rejects.toThrow(/503/);
    // Cache was invalidated: the next call retries upstream.
    const all = await repo.listAll();
    expect(all).toHaveLength(sampleProducts.length);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('search is case-insensitive and matches title/description/category', async () => {
    const fetchImpl = mockFetch(sampleProducts);
    const repo = new FakeStoreRepository({
      baseUrl: 'http://fake',
      cacheTtlMs: 1000,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const byTitle = await repo.search('BACKPACK');
    expect(byTitle.map((p) => p.id)).toEqual([1]);
    const byCategory = await repo.search('jewelery');
    expect(byCategory.map((p) => p.id).sort()).toEqual([3, 4]);
  });
});
