import { prisma } from '../../lib/prisma.js';
import { ContactRepository } from './contact.repository.js';
import { ContactService } from './contact.service.js';
import { GroupRepository } from './group.repository.js';
import { GroupService } from './group.service.js';

/**
 * Composition root for the contacts module. Wires the Prisma singleton through
 * repositories into services exactly once. Routes import the services from here.
 */
const contactRepository = new ContactRepository(prisma);
const groupRepository = new GroupRepository(prisma);

export const contactService = new ContactService(contactRepository);
export const groupService = new GroupService({
  groups: groupRepository,
  contacts: contactRepository,
});
