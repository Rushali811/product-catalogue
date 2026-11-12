import { z } from 'zod';

/**
 * Centralised, validated config. Fail fast at boot if anything required is missing.
 * Keeping this in one place makes it easy to see what the service needs to run.
 */
const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  FAKE_STORE_API_URL: z.string().url().default('https://fakestoreapi.com'),
  PRODUCT_CACHE_TTL_MS: z.coerce.number().int().nonnegative().default(60_000),
  FEATURED_PRODUCT_IDS: z.string().default('1,2,4,5,8'),

  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform((v) => v.toLowerCase() === 'true'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('Product Catalogue <no-reply@example.com>'),
  SALES_INBOX: z.string().email().default('sales@example.com'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = EnvSchema.parse(env);
  const featuredIds = parsed.FEATURED_PRODUCT_IDS.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));

  return {
    server: { port: parsed.PORT, host: parsed.HOST, corsOrigin: parsed.CORS_ORIGIN },
    products: {
      apiUrl: parsed.FAKE_STORE_API_URL,
      cacheTtlMs: parsed.PRODUCT_CACHE_TTL_MS,
      featuredIds,
    },
    email: {
      smtp: {
        host: parsed.SMTP_HOST,
        port: parsed.SMTP_PORT,
        secure: parsed.SMTP_SECURE,
        auth:
          parsed.SMTP_USER && parsed.SMTP_PASS
            ? { user: parsed.SMTP_USER, pass: parsed.SMTP_PASS }
            : undefined,
      },
      from: parsed.EMAIL_FROM,
      salesInbox: parsed.SALES_INBOX,
    },
  };
}

export type AppConfig = ReturnType<typeof loadConfig>;
