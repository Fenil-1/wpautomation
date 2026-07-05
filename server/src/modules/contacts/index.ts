/**
 * Public surface of the contacts module.
 */
export { contactRoutes } from './contact.routes.js';
export { groupRoutes } from './group.routes.js';
export { contactService, groupService } from './contacts.container.js';
export type { ContactDTO, GroupDTO, Paginated } from './contacts.types.js';
