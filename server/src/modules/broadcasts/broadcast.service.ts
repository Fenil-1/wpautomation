import type { BroadcastStatus } from '@prisma/client';
import { NotFoundError } from '../../errors/index.js';
import { createLogger } from '../../lib/logger.js';
import type { BroadcastRepository } from './broadcast.repository.js';
import type {
  CreateBroadcastInput,
  ListBroadcastsQuery,
  ResolveAudienceInput,
  UpdateBroadcastInput,
} from './broadcast.schemas.js';
import type {
  BroadcastDTO,
  BroadcastRecipientDTO,
  Paginated,
  RecipientRow,
  ResolveResult,
} from './broadcast.types.js';

const logger = createLogger({ module: 'broadcasts' });

/**
 * Business logic for broadcasts, including audience resolution. Knows nothing
 * about HTTP or Prisma internals.
 */
export class BroadcastService {
  constructor(private readonly broadcasts: BroadcastRepository) {}

  list(query: ListBroadcastsQuery): Promise<Paginated<BroadcastDTO>> {
    return this.broadcasts.findMany(query);
  }

  async getById(id: string): Promise<BroadcastDTO> {
    const broadcast = await this.broadcasts.findById(id);
    if (!broadcast) throw new NotFoundError(`Broadcast ${id} not found`);
    return broadcast;
  }

  /** List a broadcast's recipients (with contact fields + delivery status). */
  async getRecipients(id: string): Promise<BroadcastRecipientDTO[]> {
    const broadcast = await this.broadcasts.findRawById(id);
    if (!broadcast) throw new NotFoundError(`Broadcast ${id} not found`);
    return this.broadcasts.listRecipients(id);
  }

  create(input: CreateBroadcastInput): Promise<BroadcastDTO> {
    return this.broadcasts.create(input);
  }

  async update(id: string, input: UpdateBroadcastInput): Promise<BroadcastDTO> {
    const current = await this.broadcasts.findRawById(id);
    if (!current) throw new NotFoundError(`Broadcast ${id} not found`);
    return this.broadcasts.update(id, input);
  }

  async remove(id: string): Promise<void> {
    const current = await this.broadcasts.findRawById(id);
    if (!current) throw new NotFoundError(`Broadcast ${id} not found`);
    await this.broadcasts.delete(id);
  }

  /**
   * Resolve a selection of groups + individual contacts into a de-duplicated,
   * existence-checked set of recipients, and persist them.
   *
   * Steps:
   *   1. Expand each group into its member contact ids.
   *   2. Gather group-expanded + individually-selected ids (with duplicates).
   *   3. De-duplicate (unique contact ids).
   *   4. Drop ids that don't reference an existing contact.
   *   5. Assign provenance: an individually-selected contact is `individual`
   *      (sourceId = its own id); otherwise `group` (sourceId = the first group
   *      that contributed it).
   *   6. Persist the recipient rows and flip status to `ready` (or `draft` if
   *      the resolved audience is empty).
   */
  async resolveAudience(id: string, input: ResolveAudienceInput): Promise<ResolveResult> {
    const broadcast = await this.broadcasts.findRawById(id);
    if (!broadcast) throw new NotFoundError(`Broadcast ${id} not found`);

    const groupMembers = await this.broadcasts.expandGroups(input.groupIds);

    // 2. gather everything (order: group members first, then individuals)
    const gathered: string[] = [
      ...groupMembers.map((m) => m.contactId),
      ...input.contactIds,
    ];
    const totalSelected = gathered.length;

    // 3. de-duplicate
    const uniqueIds = [...new Set(gathered)];
    const duplicatesRemoved = totalSelected - uniqueIds.length;

    // 4. keep only existing contacts
    const existing = new Set(await this.broadcasts.existingContactIds(uniqueIds));
    const ignoredContactIds = uniqueIds.filter((cid) => !existing.has(cid));
    const finalIds = uniqueIds.filter((cid) => existing.has(cid));

    // 5. provenance — individual selection wins over group membership
    const individualSet = new Set(input.contactIds);
    const firstGroupByContact = new Map<string, string>();
    for (const m of groupMembers) {
      if (!firstGroupByContact.has(m.contactId)) firstGroupByContact.set(m.contactId, m.groupId);
    }

    const rows: RecipientRow[] = finalIds.map((contactId) => {
      if (individualSet.has(contactId)) {
        return { broadcastId: id, contactId, sourceType: 'individual', sourceId: contactId };
      }
      // Non-individual finalIds always came from a group, so this is defined.
      const groupId = firstGroupByContact.get(contactId) as string;
      return { broadcastId: id, contactId, sourceType: 'group', sourceId: groupId };
    });

    // 6. persist + status
    const nextStatus: BroadcastStatus = rows.length > 0 ? 'ready' : 'draft';
    await this.broadcasts.replaceRecipients(id, rows, nextStatus);

    logger.info(
      {
        broadcastId: id,
        groups: input.groupIds.length,
        individuals: input.contactIds.length,
        totalSelected,
        duplicatesRemoved,
        ignored: ignoredContactIds.length,
        finalRecipients: rows.length,
        status: nextStatus,
      },
      'resolved broadcast audience',
    );

    return {
      broadcastId: id,
      totalSelected,
      duplicatesRemoved,
      ignoredContactIds,
      finalRecipients: rows.length,
      status: nextStatus,
    };
  }
}
