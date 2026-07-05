import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { success } from '../../utils/response.js';
import { deliveryService } from './delivery.container.js';

const idParamSchema = z.object({ id: z.string().trim().min(1) });

/**
 * Delivery routes (mounted under /api).
 *
 *   POST /api/broadcasts/:id/send     enqueue delivery jobs (returns immediately)
 *   GET  /api/broadcasts/:id/progress delivery progress counts
 */
export async function deliveryRoutes(app: FastifyInstance): Promise<void> {
  app.post('/broadcasts/:id/send', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const result = await deliveryService.enqueueBroadcast(id);
    // 202 Accepted: work has been queued, not completed.
    return reply.status(202).send(success(result));
  });

  app.get('/broadcasts/:id/progress', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return success(await deliveryService.getProgress(id));
  });
}
