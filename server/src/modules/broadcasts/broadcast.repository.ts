import type { Broadcast, BroadcastStatus, Prisma, PrismaClient } from '@prisma/client';
import type { ListBroadcastsQuery } from './broadcast.schemas.js';
import type {
  BroadcastDTO,
  BroadcastRecipientDTO,
  Paginated,
  RecipientRow,
} from './broadcast.types.js';

const withCount = {
  _count: { select: { recipients: true } },
} satisfies Prisma.BroadcastInclude;

type BroadcastRow = Prisma.BroadcastGetPayload<{ include: typeof withCount }>;

/**
 * Data-access layer for broadcasts. Owns all Prisma queries for the Broadcast
 * and BroadcastRecipient models, plus the reads needed to resolve an audience
 * (group expansion, contact existence). Returns domain DTOs.
 */
export class BroadcastRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDTO(row: BroadcastRow): BroadcastDTO {
    const { _count, ...broadcast } = row;
    return { ...broadcast, recipientCount: _count.recipients };
  }

  async findMany(query: ListBroadcastsQuery): Promise<Paginated<BroadcastDTO>> {
    const where: Prisma.BroadcastWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { message: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.status = query.status;

    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.broadcast.findMany({
        where,
        include: withCount,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take: query.pageSize,
      }),
      this.prisma.broadcast.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.toDTO(r)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async findById(id: string): Promise<BroadcastDTO | null> {
    const row = await this.prisma.broadcast.findUnique({ where: { id }, include: withCount });
    return row ? this.toDTO(row) : null;
  }

  /** Bare entity fetch (no counts) for existence checks. */
  async findRawById(id: string): Promise<Broadcast | null> {
    return this.prisma.broadcast.findUnique({ where: { id } });
  }

  async create(data: { name: string; message: string }): Promise<BroadcastDTO> {
    const row = await this.prisma.broadcast.create({ data, include: withCount });
    return this.toDTO(row);
  }

  async update(
    id: string,
    data: { name?: string; message?: string; status?: BroadcastStatus },
  ): Promise<BroadcastDTO> {
    const row = await this.prisma.broadcast.update({ where: { id }, data, include: withCount });
    return this.toDTO(row);
  }

  async delete(id: string): Promise<void> {
    // Recipients are removed via onDelete: Cascade.
    await this.prisma.broadcast.delete({ where: { id } });
  }

  // --- Audience resolution reads ---

  /** Expand the given groups into their (groupId, contactId) memberships. */
  async expandGroups(groupIds: string[]): Promise<Array<{ groupId: string; contactId: string }>> {
    if (groupIds.length === 0) return [];
    return this.prisma.groupMember.findMany({
      where: { groupId: { in: groupIds } },
      select: { groupId: true, contactId: true },
    });
  }

  /** List a broadcast's recipients joined with contact display fields. */
  async listRecipients(broadcastId: string): Promise<BroadcastRecipientDTO[]> {
    const rows = await this.prisma.broadcastRecipient.findMany({
      where: { broadcastId },
      orderBy: { createdAt: 'asc' },
      include: {
        contact: {
          select: { name: true, businessName: true, countryCode: true, phoneNumber: true },
        },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      contactId: r.contactId,
      status: r.status,
      sourceType: r.sourceType,
      sourceId: r.sourceId,
      name: r.contact.name,
      businessName: r.contact.businessName,
      countryCode: r.contact.countryCode,
      phoneNumber: r.contact.phoneNumber,
    }));
  }

  /** Return the subset of contact ids that actually exist. */
  async existingContactIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.contact.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  /**
   * Replace a broadcast's recipients with a fresh set and set its status — all
   * in one transaction so the audience is never left half-written.
   */
  async replaceRecipients(
    broadcastId: string,
    rows: RecipientRow[],
    nextStatus: BroadcastStatus,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.broadcastRecipient.deleteMany({ where: { broadcastId } }),
      this.prisma.broadcastRecipient.createMany({ data: rows, skipDuplicates: true }),
      this.prisma.broadcast.update({ where: { id: broadcastId }, data: { status: nextStatus } }),
    ]);
  }
}
