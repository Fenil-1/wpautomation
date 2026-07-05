import type { FastifyInstance } from 'fastify';
import { success } from '../../utils/response.js';
import { groupService } from './contacts.container.js';
import {
  addContactsToGroupSchema,
  createGroupSchema,
  groupIdParamSchema,
  listGroupsQuerySchema,
  membershipParamSchema,
  updateGroupSchema,
} from './group.schemas.js';

/**
 * Group + membership routes.
 *
 *   GET    /api/groups                          list
 *   POST   /api/groups                          create
 *   PATCH  /api/groups/:id                      update
 *   DELETE /api/groups/:id                      delete (cascades memberships)
 *   POST   /api/groups/:id/contacts            add contacts { contactIds: [] }
 *   DELETE /api/groups/:id/contacts/:contactId remove one contact
 */
export async function groupRoutes(app: FastifyInstance): Promise<void> {
  app.get('/groups', async (request) => {
    const query = listGroupsQuerySchema.parse(request.query);
    return success(await groupService.list(query));
  });

  app.post('/groups', async (request, reply) => {
    const input = createGroupSchema.parse(request.body);
    const group = await groupService.create(input);
    return reply.status(201).send(success(group));
  });

  app.patch('/groups/:id', async (request) => {
    const { id } = groupIdParamSchema.parse(request.params);
    const input = updateGroupSchema.parse(request.body);
    return success(await groupService.update(id, input));
  });

  app.delete('/groups/:id', async (request, reply) => {
    const { id } = groupIdParamSchema.parse(request.params);
    await groupService.remove(id);
    return reply.status(204).send();
  });

  app.post('/groups/:id/contacts', async (request) => {
    const { id } = groupIdParamSchema.parse(request.params);
    const { contactIds } = addContactsToGroupSchema.parse(request.body);
    return success(await groupService.addContacts(id, contactIds));
  });

  app.delete('/groups/:id/contacts/:contactId', async (request, reply) => {
    const { id, contactId } = membershipParamSchema.parse(request.params);
    await groupService.removeContact(id, contactId);
    return reply.status(204).send();
  });
}
