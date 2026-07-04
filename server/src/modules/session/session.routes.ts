import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { success } from '../../utils/response.js';
import { sessionManager } from './session.container.js';

const disconnectBodySchema = z
  .object({ logout: z.boolean().optional() })
  .optional()
  .default({});

/**
 * Session routes. Handlers stay thin: parse/validate input, delegate to the
 * `SessionManager`, and wrap the result. All lifecycle logic lives in the
 * service; all errors flow through the central error handler.
 *
 *   GET  /api/session             -> current status snapshot
 *   GET  /api/session/qr          -> QR (raw + PNG data URL) to scan
 *   POST /api/session/connect     -> start / resume the connection
 *   POST /api/session/disconnect  -> stop (optionally { logout: true })
 */
export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.get('/session', async () => {
    return success(sessionManager.getDefault().getSnapshot());
  });

  app.get('/session/qr', async () => {
    const payload = await sessionManager.getDefault().getQrPayload();
    return success(payload);
  });

  app.post('/session/connect', async (_request, reply) => {
    const snapshot = await sessionManager.getDefault().connect();
    // 202: connection initiated; QR/connected state is reached asynchronously.
    return reply.status(202).send(success(snapshot));
  });

  app.post('/session/disconnect', async (request, reply) => {
    const { logout } = disconnectBodySchema.parse(request.body);
    const snapshot = await sessionManager.getDefault().disconnect({ logout });
    return reply.send(success(snapshot));
  });
}
