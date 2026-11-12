import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { EmailProvider } from '../email/EmailProvider.js';
import type { ProductRepository } from '../repositories/ProductRepository.js';

interface Deps {
  repository: ProductRepository;
  emailProvider: EmailProvider;
  fromAddress: string;
  salesInbox: string;
}

const EnquirySchema = z.object({
  productId: z.number().int().positive(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  message: z.string().trim().min(1).max(2000),
});

export type EnquiryInput = z.infer<typeof EnquirySchema>;

export async function enquiriesRoutes(app: FastifyInstance, deps: Deps) {
  const { repository, emailProvider, fromAddress, salesInbox } = deps;

  app.post('/api/enquiries', async (req, reply) => {
    const parsed = EnquirySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid enquiry',
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      });
    }
    const input = parsed.data;

    const product = await repository.getById(input.productId);
    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }

    const subject = `New enquiry: ${product.title} (#${product.id})`;
    const text = [
      `New enquiry received for "${product.title}" (#${product.id}).`,
      '',
      `Name:    ${input.name}`,
      `Email:   ${input.email}`,
      input.phone ? `Phone:   ${input.phone}` : null,
      '',
      'Message:',
      input.message,
      '',
      `Product: ${product.title}`,
      `Price:   $${product.price.toFixed(2)}`,
      `Category:${product.category}`,
    ]
      .filter((l) => l !== null)
      .join('\n');

    try {
      await emailProvider.send({
        from: fromAddress,
        to: salesInbox,
        replyTo: input.email,
        subject,
        text,
      });
    } catch (err) {
      req.log.error({ err }, 'Failed to send enquiry email');
      return reply.code(502).send({ error: 'Could not deliver enquiry. Please try again later.' });
    }

    return reply.code(202).send({ status: 'accepted' });
  });
}
