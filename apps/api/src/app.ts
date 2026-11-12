import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type { ProductRepository } from './repositories/ProductRepository.js';
import { FakeStoreRepository } from './repositories/FakeStoreRepository.js';
import type { EmailProvider } from './email/EmailProvider.js';
import { SmtpEmailProvider } from './email/SmtpEmailProvider.js';
import { productsRoutes } from './routes/products.js';
import { enquiriesRoutes } from './routes/enquiries.js';
import type { AppConfig } from './config.js';

export interface BuildAppOptions {
  config: AppConfig;
  repository?: ProductRepository;
  emailProvider?: EmailProvider;
  logger?: boolean;
}

/**
 * Factory for the Fastify instance. Everything the app depends on is injected,
 * so tests can pass in fakes without mocking modules.
 */
export async function buildApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  const { config } = opts;
  const app = Fastify({ logger: opts.logger ?? false });

  await app.register(cors, {
    origin: config.server.corsOrigin.split(',').map((o) => o.trim()),
  });

  const repository =
    opts.repository ??
    new FakeStoreRepository({
      baseUrl: config.products.apiUrl,
      cacheTtlMs: config.products.cacheTtlMs,
    });

  const emailProvider = opts.emailProvider ?? new SmtpEmailProvider(config.email.smtp);

  app.get('/health', async () => ({ status: 'ok' }));

  await productsRoutes(app, {
    repository,
    featuredIds: config.products.featuredIds,
  });

  await enquiriesRoutes(app, {
    repository,
    emailProvider,
    fromAddress: config.email.from,
    salesInbox: config.email.salesInbox,
  });

  return app;
}
