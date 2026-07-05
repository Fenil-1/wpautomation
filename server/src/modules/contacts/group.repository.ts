import type { Group, Prisma, PrismaClient } from '@prisma/client';
import type { ListGroupsQuery } from './group.schemas.js';
import type { GroupDTO, Paginated } from './contacts.types.js';

const withCount = {
  _count: { select: { members: true } },
} satisfies Prisma.GroupInclude;

type GroupRow = Prisma.GroupGetPayload<{ include: typeof withCount }>;

/** Data-access layer for groups and group membership. */
export class GroupRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDTO(row: GroupRow): GroupDTO {
    const { _count, ...group } = row;
    return { ...group, memberCount: _count.members };
  }

  async findMany(query: ListGroupsQuery): Promise<Paginated<GroupDTO>> {
    const where: Prisma.GroupWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};
    const skip = (query.page - 1) * query.pageSize;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where,
        include: withCount,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take: query.pageSize,
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.toDTO(r)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async findById(id: string): Promise<GroupDTO | null> {
    const row = await this.prisma.group.findUnique({ where: { id }, include: withCount });
    return row ? this.toDTO(row) : null;
  }

  async findByName(name: string): Promise<Group | null> {
    return this.prisma.group.findUnique({ where: { name } });
  }

  async create(data: { name: string; description?: string | null; color?: string | null }): Promise<GroupDTO> {
    const row = await this.prisma.group.create({ data, include: withCount });
    return this.toDTO(row);
  }

  async update(
    id: string,
    data: { name?: string; description?: string | null; color?: string | null },
  ): Promise<GroupDTO> {
    const row = await this.prisma.group.update({ where: { id }, data, include: withCount });
    return this.toDTO(row);
  }

  async delete(id: string): Promise<void> {
    // Memberships are removed automatically via onDelete: Cascade.
    await this.prisma.group.delete({ where: { id } });
  }

  /**
   * Add contacts to a group and return the refreshed group.
   * Runs in a transaction so the insert and the recomputed member count are
   * a single atomic, consistent read. Existing memberships are skipped.
   */
  async addContactsAndReturn(groupId: string, contactIds: string[]): Promise<GroupDTO> {
    const [, group] = await this.prisma.$transaction([
      this.prisma.groupMember.createMany({
        data: contactIds.map((contactId) => ({ groupId, contactId })),
        skipDuplicates: true,
      }),
      this.prisma.group.findUniqueOrThrow({ where: { id: groupId }, include: withCount }),
    ]);
    return this.toDTO(group);
  }

  /** Remove one contact from a group. Returns how many memberships were removed. */
  async removeContact(groupId: string, contactId: string): Promise<number> {
    const result = await this.prisma.groupMember.deleteMany({ where: { groupId, contactId } });
    return result.count;
  }
}
