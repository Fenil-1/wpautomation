// Groups API — typed wrappers over the backend /api/groups endpoints.
import { apiClient, type QueryParams } from './client';
import type { Paginated } from './contacts';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

export interface ListGroupsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateGroupInput {
  name: string;
  description?: string | null;
  color?: string | null;
}

export type UpdateGroupInput = Partial<CreateGroupInput>;

export const groupsApi = {
  list: (params: ListGroupsParams = {}, signal?: AbortSignal) =>
    apiClient.get<Paginated<Group>>('/groups', params as QueryParams, signal),

  create: (input: CreateGroupInput) => apiClient.post<Group>('/groups', input),

  update: (id: string, input: UpdateGroupInput) =>
    apiClient.patch<Group>(`/groups/${id}`, input),

  remove: (id: string) => apiClient.del<void>(`/groups/${id}`),

  // Membership
  addContacts: (groupId: string, contactIds: string[]) =>
    apiClient.post<Group>(`/groups/${groupId}/contacts`, { contactIds }),

  removeContact: (groupId: string, contactId: string) =>
    apiClient.del<void>(`/groups/${groupId}/contacts/${contactId}`),
};
