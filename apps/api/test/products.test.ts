import { describe, it, expect, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { FakeEmailProvider, InMemoryProductRepository, testConfig } from './helpers.js';

describe('products routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({
      config: testConfig,
      repository: new InMemoryProductRepository(),
      emailProvider: new FakeEmailProvider(),
    });
  });

  it('GET /api/products/featured returns curated top-rated products in order', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/products/featured' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.products.map((p: { id: number }) => p.id)).toEqual([1, 2, 4]);
  });

  it('GET /api/categories lists unique, sorted categories', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/categories' });
    expect(res.statusCode).toBe(200);
    expect(res.json().categories).toEqual(['electronics', 'jewelery', "men's clothing"]);
  });

  it('GET /api/categories/:category/products returns featured + additional, no duplicates', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/categories/${encodeURIComponent("men's clothing")}/products`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.category).toBe("men's clothing");
    const featuredIds = body.featured.map((p: { id: number }) => p.id);
    const additionalIds = body.additional.map((p: { id: number }) => p.id);
    expect(featuredIds).toEqual([1, 2]);
    expect(additionalIds).toEqual([]);
    // Make sure no product appears in both lists.
    const overlap = featuredIds.filter((id: number) => additionalIds.includes(id));
    expect(overlap).toEqual([]);
  });

  it('GET /api/categories/:category/products 404s for unknown categories', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/categories/unknown/products' });
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/products/search returns products whose text matches', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/products/search?q=silver' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.query).toBe('silver');
    expect(body.products.map((p: { id: number }) => p.id)).toEqual([4]);
  });

  it('GET /api/products/search requires q', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/products/search' });
    expect(res.statusCode).toBe(400);
  });

  it('GET /api/products/:id returns a single product', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/products/3' });
    expect(res.statusCode).toBe(200);
    expect(res.json().product.title).toBe('Gold Necklace');
  });

  it('GET /api/products/:id 404s for unknown ids', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/products/999' });
    expect(res.statusCode).toBe(404);
  });
});
