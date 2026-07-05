import type { Contact, Group } from '@prisma/client';

/** Lightweight group reference embedded in a contact response. */
export interface GroupRef {
  id: string;
  name: string;
  color: string | null;
}

/** A contact plus the groups it belongs to. */
export type ContactDTO = Contact & { groups: GroupRef[] };

/** A group plus its member count. */
export type GroupDTO = Group & { memberCount: number };

/** Generic pagination envelope returned by list endpoints. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Normalized write payload the repository persists (post-validation). */
export interface ContactWriteData {
  name?: string;
  phoneNumber?: string;
  countryCode?: string;
  businessName?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
  isBlocked?: boolean;
  isOptedOut?: boolean;
}
