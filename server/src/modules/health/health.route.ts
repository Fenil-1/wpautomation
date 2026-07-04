import type { FastifyInstance } from 'fastify';
import { getHealthReport } from './health.service.js';
import { success } from '../../utils/response.js';

/**
 * Health route plugin.
 *
 * Route handlers stay thin: they translate HTTP <-> service calls and nothing
 * more. All logic lives in `health.service.ts`.
 *
 * Returns HTTP 200 when healthy and 503 when degraded, so uptime monitors can
 * rely on the status code while humans still get the full JSON body.
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_request, reply) => {
    const report = await getHealthReport();
    const statusCode = report.status === 'ok' ? 200 : 503;
    return reply.status(statusCode).send(success(report));
  });
}
