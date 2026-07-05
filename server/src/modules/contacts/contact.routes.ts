import type { FastifyInstance } from 'fastify';
import { success } from '../../utils/response.js';
import { contactService } from './contacts.container.js';
import {
  createContactSchema,
  idParamSchema,
  listContactsQuerySchema,
  updateContactSchema,
} from './contact.schemas.js';

/**
 * Contact routes. Handlers only parse/validate input and delegate to the
 * service; all business logic and error mapping happen below the route layer.
 *
 *   GET    /api/contacts       list (pagination, search, sort, filters)
 *   GET    /api/contacts/:id   fetch one
 *   POST   /api/contacts       create
 *   PATCH  /api/contacts/:id   partial update
 *   DELETE /api/contacts/:id   delete
 */
export async function contactRoutes(app: FastifyInstance): Promise<void> {
  app.get('/contacts', async (request) => {
    const query = listContactsQuerySchema.parse(request.query);
    return success(await contactService.list(query));
  });

  app.get('/contacts/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return success(await contactService.getById(id));
  });

  app.post('/contacts', async (request, reply) => {
    const input = createContactSchema.parse(request.body);
    const contact = await contactService.create(input);
    return reply.status(201).send(success(contact));
  });

  app.patch('/contacts/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateContactSchema.parse(request.body);
    return success(await contactService.update(id, input));
  });

  app.delete('/contacts/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await contactService.remove(id);
    return reply.status(204).send();
  });
}
