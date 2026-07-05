// Contacts API — typed wrappers over the backend /api/contacts endpoints.
import { apiClient, type QueryParams } from './client';

export interface GroupRef {
  id: string;
  name: string;
  color: string | null;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  countryCode: string;
  businessName: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  isBlocked: boolean;
  isOptedOut: boolean;
  lastInteractionAt: string | null;
  engagementScore: number;
  lastMessageAt: string | null;
  lastReplyAt: string | null;
  messageCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  groups: GroupRef[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListContactsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastInteractionAt' | 'engagementScore' | 'city';
  sortOrder?: 'asc' | 'desc';
  isBlocked?: boolean;
  isOptedOut?: boolean;
  groupId?: string;
  city?: string;
}

export interface CreateContactInput {
  name: string;
  phoneNumber: string;
  countryCode?: string;
  businessName?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
  isBlocked?: boolean;
  isOptedOut?: boolean;
}

export type UpdateContactInput = Partial<CreateContactInput>;

export const contactsApi = {
  list: (params: ListContactsParams = {}, signal?: AbortSignal) =>
    apiClient.get<Paginated<Contact>>('/contacts', params as QueryParams, signal),

  get: (id: string, signal?: AbortSignal) =>
    apiClient.get<Contact>(`/contacts/${id}`, undefined, signal),

  create: (input: CreateContactInput) => apiClient.post<Contact>('/contacts', input),

  update: (id: string, input: UpdateContactInput) =>
    apiClient.patch<Contact>(`/contacts/${id}`, input),

  remove: (id: string) => apiClient.del<void>(`/contacts/${id}`),
};
