import { describe, it, expect, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { FakeEmailProvider, InMemoryProductRepository, testConfig } from './helpers.js';

describe('enquiries route', () => {
  let app: FastifyInstance;
  let email: FakeEmailProvider;

  beforeEach(async () => {
    email = new FakeEmailProvider();
    app = await buildApp({
      config: testConfig,
      repository: new InMemoryProductRepository(),
      emailProvider: email,
    });
  });

  const validBody = {
    productId: 1,
    name: 'Alex Example',
    email: 'alex@example.com',
    phone: '123',
    message: "I'm interested in this backpack — is it still available?",
  };

  it('POST /api/enquiries accepts a valid enquiry and sends an email to the sales inbox', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/enquiries', payload: validBody });
    expect(res.statusCode).toBe(202);
    expect(res.json()).toEqual({ status: 'accepted' });
    expect(email.sent).toHaveLength(1);
    const msg = email.sent[0]!;
    expect(msg.to).toBe('sales@example.com');
    expect(msg.replyTo).toBe('alex@example.com');
    expect(msg.subject).toContain('Red Backpack');
    expect(msg.text).toContain('Alex Example');
    expect(msg.text).toContain('still available');
  });

  it('rejects invalid payloads with 400 and does not send email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/enquiries',
      payload: { ...validBody, email: 'not-an-email' },
    });
    expect(res.statusCode).toBe(400);
    expect(email.sent).toHaveLength(0);
  });

  it('returns 404 when the product does not exist', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/enquiries',
      payload: { ...validBody, productId: 999 },
    });
    expect(res.statusCode).toBe(404);
    expect(email.sent).toHaveLength(0);
  });

  it('returns 502 when the email provider fails', async () => {
    email.shouldFail = true;
    const res = await app.inject({ method: 'POST', url: '/api/enquiries', payload: validBody });
    expect(res.statusCode).toBe(502);
  });
});
