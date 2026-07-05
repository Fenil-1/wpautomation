import type {
  Broadcast,
  BroadcastStatus,
  RecipientSourceType,
  RecipientStatus,
} from '@prisma/client';

/** A broadcast plus its recipient count. */
export type BroadcastDTO = Broadcast & { recipientCount: number };

/** A broadcast recipient joined with its contact's display fields. */
export interface BroadcastRecipientDTO {
  id: string;
  contactId: string;
  status: RecipientStatus;
  sourceType: RecipientSourceType;
  sourceId: string;
  name: string;
  businessName: string | null;
  countryCode: string;
  phoneNumber: string;
}

/** Generic pagination envelope (mirrors the contacts module). */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** A recipient row to be persisted during audience resolution. */
export interface RecipientRow {
  broadcastId: string;
  contactId: string;
  sourceType: RecipientSourceType;
  sourceId: string;
}

/** Result of resolving a broadcast's audience. */
export interface ResolveResult {
  broadcastId: string;
  /** All contact references gathered after expanding groups (incl. duplicates). */
  totalSelected: number;
  /** How many references were duplicates of an already-seen contact. */
  duplicatesRemoved: number;
  /** Unique contact ids that did not exist and were ignored. */
  ignoredContactIds: string[];
  /** Final number of unique, existing recipients persisted. */
  finalRecipients: number;
  /** Broadcast status after resolution. */
  status: BroadcastStatus;
}
