import { ConflictError, NotFoundError } from '../../errors/index.js';
import type { ContactRepository } from './contact.repository.js';
import type { CreateContactInput, ListContactsQuery, UpdateContactInput } from './contact.schemas.js';
import type { ContactDTO, ContactWriteData, Paginated } from './contacts.types.js';
import { isUniqueConstraintError } from './prisma-error.util.js';

/**
 * Business logic for contacts. Enforces the domain rules (phone uniqueness,
 * existence) and translates persistence errors into the shared AppError
 * hierarchy. Knows nothing about HTTP or Prisma internals.
 */
export class ContactService {
  constructor(private readonly contacts: ContactRepository) {}

  list(query: ListContactsQuery): Promise<Paginated<ContactDTO>> {
    return this.contacts.findMany(query);
  }

  async getById(id: string): Promise<ContactDTO> {
    const contact = await this.contacts.findById(id);
    if (!contact) throw new NotFoundError(`Contact ${id} not found`);
    return contact;
  }

  async create(input: CreateContactInput): Promise<ContactDTO> {
    const data = this.normalize(input);

    // Explicit pre-check for a friendly 409; the DB unique constraint is the
    // ultimate guard (handled below) against races.
    const existing = await this.contacts.findByPhone(data.countryCode, data.phoneNumber);
    if (existing) {
      throw new ConflictError(
        `A contact with phone ${data.countryCode} ${data.phoneNumber} already exists`,
      );
    }

    try {
      return await this.contacts.create({
        name: data.name,
        phoneNumber: data.phoneNumber,
        countryCode: data.countryCode,
        ...data.optional,
      });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        throw new ConflictError('A contact with this phone number already exists');
      }
      throw err;
    }
  }

  async update(id: string, input: UpdateContactInput): Promise<ContactDTO> {
    const current = await this.contacts.findById(id);
    if (!current) throw new NotFoundError(`Contact ${id} not found`);

    const nextPhone = input.phoneNumber
      ? input.phoneNumber.replace(/\D/g, '')
      : current.phoneNumber;
    const nextCountry = input.countryCode ?? current.countryCode;

    // If the identity (country + phone) changes, ensure it stays unique.
    if (nextPhone !== current.phoneNumber || nextCountry !== current.countryCode) {
      const clash = await this.contacts.findByPhone(nextCountry, nextPhone);
      if (clash && clash.id !== id) {
        throw new ConflictError(
          `A contact with phone ${nextCountry} ${nextPhone} already exists`,
        );
      }
    }

    const data: ContactWriteData = { ...input };
    if (input.phoneNumber) data.phoneNumber = nextPhone;

    try {
      return await this.contacts.update(id, data);
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        throw new ConflictError('A contact with this phone number already exists');
      }
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    const current = await this.contacts.findById(id);
    if (!current) throw new NotFoundError(`Contact ${id} not found`);
    await this.contacts.delete(id);
  }

  /** Normalize input: strip non-digits from the phone, split required/optional. */
  private normalize(input: CreateContactInput): {
    name: string;
    phoneNumber: string;
    countryCode: string;
    optional: ContactWriteData;
  } {
    const { name, phoneNumber, countryCode, ...optional } = input;
    return {
      name: name.trim(),
      phoneNumber: phoneNumber.replace(/\D/g, ''),
      countryCode,
      optional,
    };
  }
}
