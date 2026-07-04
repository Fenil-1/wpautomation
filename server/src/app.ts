import Fastify, { type FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { loggerOptions } from './lib/logger.js';
import { registerErrorHandler } from './middleware/error-handler.js';
import { healthRoutes } from './modules/health/health.route.js';
import { sessionRoutes } from './modules/session/index.js';
import { API_PREFIX } from './utils/constants.js';

/**
 * Build and configure the Fastify application.
 *
 * Kept separate from `index.ts` (which owns process lifecycle) so the app can
 * be constructed in isolation — e.g. for integration tests — without binding a
 * port. New feature modules register their routes here under `API_PREFIX`.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: loggerOptions,
    disableRequestLogging: false,
    genReqId: () => randomUUID(),
  });

  registerErrorHandler(app);

  // Feature modules — mounted under /api.
  await app.register(healthRoutes, { prefix: API_PREFIX });
  await app.register(sessionRoutes, { prefix: API_PREFIX });

  return app;
}
