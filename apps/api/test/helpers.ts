import type { Product, ProductRepository } from '../src/repositories/ProductRepository.js';
import type { EmailProvider, EmailMessage } from '../src/email/EmailProvider.js';
import type { AppConfig } from '../src/config.js';

export const sampleProducts: Product[] = [
  {
    id: 1,
    title: 'Red Backpack',
    description: 'A sturdy red backpack for everyday use.',
    price: 55,
    category: "men's clothing",
    image: 'https://example.com/1.jpg',
    rating: { rate: 4.5, count: 120 },
  },
  {
    id: 2,
    title: 'Blue T-Shirt',
    description: 'Soft cotton tee in cobalt blue.',
    price: 25,
    category: "men's clothing",
    image: 'https://example.com/2.jpg',
    rating: { rate: 4.1, count: 50 },
  },
  {
    id: 3,
    title: 'Gold Necklace',
    description: 'Elegant 18k gold necklace.',
    price: 400,
    category: 'jewelery',
    image: 'https://example.com/3.jpg',
    rating: { rate: 4.8, count: 20 },
  },
  {
    id: 4,
    title: 'Silver Ring',
    description: 'Minimalist silver ring.',
    price: 90,
    category: 'jewelery',
    image: 'https://example.com/4.jpg',
    rating: { rate: 4.2, count: 42 },
  },
  {
    id: 5,
    title: 'Wireless Mouse',
    description: 'Ergonomic Bluetooth mouse.',
    price: 35,
    category: 'electronics',
    image: 'https://example.com/5.jpg',
    rating: { rate: 4.4, count: 310 },
  },
];

export class InMemoryProductRepository implements ProductRepository {
  constructor(private readonly products: Product[] = sampleProducts) {}
  async listAll() {
    return this.products;
  }
  async getById(id: number) {
    return this.products.find((p) => p.id === id) ?? null;
  }
  async listCategories() {
    return [...new Set(this.products.map((p) => p.category))].sort();
  }
  async listByCategory(category: string) {
    const needle = category.toLowerCase();
    return this.products.filter((p) => p.category.toLowerCase() === needle);
  }
  async search(term: string) {
    const q = term.trim().toLowerCase();
    if (!q) return [];
    return this.products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }
  async listFeatured(ids: number[]) {
    const byId = new Map(this.products.map((p) => [p.id, p] as const));
    return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
  }
  async listFeaturedInCategory(category: string, ids: number[]) {
    const inCat = await this.listByCategory(category);
    const allowed = new Set(inCat.map((p) => p.id));
    const feat = await this.listFeatured(ids);
    return feat.filter((p) => allowed.has(p.id));
  }
}

export class FakeEmailProvider implements EmailProvider {
  public readonly sent: EmailMessage[] = [];
  public shouldFail = false;
  async send(message: EmailMessage) {
    if (this.shouldFail) throw new Error('Simulated SMTP failure');
    this.sent.push(message);
  }
}

export const testConfig: AppConfig = {
  server: { port: 0, host: '127.0.0.1', corsOrigin: 'http://localhost:5173' },
  products: {
    apiUrl: 'http://fake-upstream.invalid',
    cacheTtlMs: 0,
    featuredIds: [1, 2, 4],
  },
  email: {
    smtp: { host: 'localhost', port: 1025, secure: false, auth: undefined },
    from: 'Test <test@example.com>',
    salesInbox: 'sales@example.com',
  },
};
