import type { FastifyInstance } from 'fastify';
import { success } from '../../utils/response.js';
import { broadcastService } from './broadcasts.container.js';
import {
  createBroadcastSchema,
  idParamSchema,
  listBroadcastsQuerySchema,
  resolveAudienceSchema,
  updateBroadcastSchema,
} from './broadcast.schemas.js';

/**
 * Broadcast routes. Thin handlers: parse/validate, delegate to the service,
 * wrap the result. Errors flow through the central error handler.
 *
 *   POST   /api/broadcasts             create
 *   GET    /api/broadcasts             list (pagination, search, status filter)
 *   GET    /api/broadcasts/:id         fetch one
 *   PATCH  /api/broadcasts/:id         update
 *   DELETE /api/broadcasts/:id         delete
 *   POST   /api/broadcasts/:id/resolve resolve audience -> recipients
 */
export async function broadcastRoutes(app: FastifyInstance): Promise<void> {
  app.post('/broadcasts', async (request, reply) => {
    const input = createBroadcastSchema.parse(request.body);
    const broadcast = await broadcastService.create(input);
    return reply.status(201).send(success(broadcast));
  });

  app.get('/broadcasts', async (request) => {
    const query = listBroadcastsQuerySchema.parse(request.query);
    return success(await broadcastService.list(query));
  });

  app.get('/broadcasts/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return success(await broadcastService.getById(id));
  });

  // Read-only: recipients + their delivery status (for the UI stats breakdown
  // and edit-mode recipient pre-select). No writes, no queue/worker involvement.
  app.get('/broadcasts/:id/recipients', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return success(await broadcastService.getRecipients(id));
  });

  app.patch('/broadcasts/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateBroadcastSchema.parse(request.body);
    return success(await broadcastService.update(id, input));
  });

  app.delete('/broadcasts/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await broadcastService.remove(id);
    return reply.status(204).send();
  });

  app.post('/broadcasts/:id/resolve', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = resolveAudienceSchema.parse(request.body);
    return success(await broadcastService.resolveAudience(id, input));
  });
}
