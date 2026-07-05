import type { Contact, Prisma, PrismaClient } from '@prisma/client';
import type { ListContactsQuery } from './contact.schemas.js';
import type { ContactDTO, ContactWriteData, Paginated } from './contacts.types.js';

/** Include clause that hydrates a contact's group memberships. */
const withGroups = {
  memberships: {
    include: {
      group: { select: { id: true, name: true, color: true } },
    },
  },
} satisfies Prisma.ContactInclude;

type ContactRow = Prisma.ContactGetPayload<{ include: typeof withGroups }>;

/**
 * Data-access layer for contacts. Owns ALL Prisma queries for the Contact
 * model; the service layer never touches Prisma directly. Returns domain DTOs,
 * not raw rows, so the shape the API sees is defined in one place.
 */
export class ContactRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDTO(row: ContactRow): ContactDTO {
    const { memberships, ...contact } = row;
    return {
      ...contact,
      groups: memberships.map((m) => m.group),
    };
  }

  private buildWhere(query: ListContactsQuery): Prisma.ContactWhereInput {
    const where: Prisma.ContactWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phoneNumber: { contains: query.search } },
        { businessName: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isBlocked !== undefined) where.isBlocked = query.isBlocked;
    if (query.isOptedOut !== undefined) where.isOptedOut = query.isOptedOut;
    if (query.city) where.city = { equals: query.city, mode: 'insensitive' };
    if (query.groupId) where.memberships = { some: { groupId: query.groupId } };

    return where;
  }

  async findMany(query: ListContactsQuery): Promise<Paginated<ContactDTO>> {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    // Page of rows + total count in a single transaction for a consistent read.
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        include: withGroups,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take: query.pageSize,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.toDTO(r)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async findById(id: string): Promise<ContactDTO | null> {
    const row = await this.prisma.contact.findUnique({ where: { id }, include: withGroups });
    return row ? this.toDTO(row) : null;
  }

  async findByPhone(countryCode: string, phoneNumber: string): Promise<Contact | null> {
    return this.prisma.contact.findUnique({
      where: { countryCode_phoneNumber: { countryCode, phoneNumber } },
    });
  }

  /** Return the subset of the given ids that actually exist. */
  async existingIds(ids: string[]): Promise<string[]> {
    const rows = await this.prisma.contact.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async create(data: Required<Pick<ContactWriteData, 'name' | 'phoneNumber' | 'countryCode'>> & ContactWriteData): Promise<ContactDTO> {
    const row = await this.prisma.contact.create({ data, include: withGroups });
    return this.toDTO(row);
  }

  async update(id: string, data: ContactWriteData): Promise<ContactDTO> {
    const row = await this.prisma.contact.update({ where: { id }, data, include: withGroups });
    return this.toDTO(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.contact.delete({ where: { id } });
  }
}
