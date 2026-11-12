import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ProductRepository } from '../repositories/ProductRepository.js';

interface Deps {
  repository: ProductRepository;
  featuredIds: number[];
}

export async function productsRoutes(app: FastifyInstance, deps: Deps) {
  const { repository, featuredIds } = deps;

  app.get('/api/products/featured', async () => {
    const products = await repository.listFeatured(featuredIds);
    return { products };
  });

  app.get('/api/categories', async () => {
    const categories = await repository.listCategories();
    return { categories };
  });

  const CategoryParams = z.object({ category: z.string().min(1) });
  app.get('/api/categories/:category/products', async (req, reply) => {
    const parsed = CategoryParams.safeParse(req.params);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid category' });
    const category = decodeURIComponent(parsed.data.category);
    const [featured, all] = await Promise.all([
      repository.listFeaturedInCategory(category, featuredIds),
      repository.listByCategory(category),
    ]);
    if (all.length === 0) return reply.code(404).send({ error: 'Category not found' });
    const featuredIdSet = new Set(featured.map((p) => p.id));
    const additional = all.filter((p) => !featuredIdSet.has(p.id));
    return { category, featured, additional };
  });

  const SearchQuery = z.object({ q: z.string().trim().min(1) });
  app.get('/api/products/search', async (req, reply) => {
    const parsed = SearchQuery.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Missing search term (q)' });
    }
    const products = await repository.search(parsed.data.q);
    return { query: parsed.data.q, products };
  });

  const IdParams = z.object({ id: z.coerce.number().int().positive() });
  app.get('/api/products/:id', async (req, reply) => {
    const parsed = IdParams.safeParse(req.params);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid product id' });
    const product = await repository.getById(parsed.data.id);
    if (!product) return reply.code(404).send({ error: 'Product not found' });
    return { product };
  });
}
