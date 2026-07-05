import { ConflictError, NotFoundError } from '../../errors/index.js';
import type { ContactRepository } from './contact.repository.js';
import type { GroupRepository } from './group.repository.js';
import type { CreateGroupInput, ListGroupsQuery, UpdateGroupInput } from './group.schemas.js';
import type { GroupDTO, Paginated } from './contacts.types.js';
import { isUniqueConstraintError } from './prisma-error.util.js';

export interface GroupServiceDeps {
  groups: GroupRepository;
  contacts: ContactRepository;
}

/** Business logic for groups and group membership. */
export class GroupService {
  private readonly groups: GroupRepository;
  private readonly contacts: ContactRepository;

  constructor(deps: GroupServiceDeps) {
    this.groups = deps.groups;
    this.contacts = deps.contacts;
  }

  list(query: ListGroupsQuery): Promise<Paginated<GroupDTO>> {
    return this.groups.findMany(query);
  }

  async getById(id: string): Promise<GroupDTO> {
    const group = await this.groups.findById(id);
    if (!group) throw new NotFoundError(`Group ${id} not found`);
    return group;
  }

  async create(input: CreateGroupInput): Promise<GroupDTO> {
    const existing = await this.groups.findByName(input.name);
    if (existing) throw new ConflictError(`A group named "${input.name}" already exists`);

    try {
      return await this.groups.create(input);
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        throw new ConflictError(`A group named "${input.name}" already exists`);
      }
      throw err;
    }
  }

  async update(id: string, input: UpdateGroupInput): Promise<GroupDTO> {
    const current = await this.groups.findById(id);
    if (!current) throw new NotFoundError(`Group ${id} not found`);

    if (input.name && input.name !== current.name) {
      const clash = await this.groups.findByName(input.name);
      if (clash && clash.id !== id) {
        throw new ConflictError(`A group named "${input.name}" already exists`);
      }
    }

    try {
      return await this.groups.update(id, input);
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        throw new ConflictError('A group with this name already exists');
      }
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    const current = await this.groups.findById(id);
    if (!current) throw new NotFoundError(`Group ${id} not found`);
    await this.groups.delete(id);
  }

  /** Add contacts to a group, validating that both the group and all contacts exist. */
  async addContacts(groupId: string, contactIds: string[]): Promise<GroupDTO> {
    const group = await this.groups.findById(groupId);
    if (!group) throw new NotFoundError(`Group ${groupId} not found`);

    const uniqueIds = [...new Set(contactIds)];
    const existing = await this.contacts.existingIds(uniqueIds);
    if (existing.length !== uniqueIds.length) {
      const missing = uniqueIds.filter((id) => !existing.includes(id));
      throw new NotFoundError(`Unknown contact id(s): ${missing.join(', ')}`);
    }

    return this.groups.addContactsAndReturn(groupId, uniqueIds);
  }

  /** Remove a contact from a group. 404 if the group or the membership is absent. */
  async removeContact(groupId: string, contactId: string): Promise<void> {
    const group = await this.groups.findById(groupId);
    if (!group) throw new NotFoundError(`Group ${groupId} not found`);

    const removed = await this.groups.removeContact(groupId, contactId);
    if (removed === 0) {
      throw new NotFoundError(`Contact ${contactId} is not a member of group ${groupId}`);
    }
  }
}
