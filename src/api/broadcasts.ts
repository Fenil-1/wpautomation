// Broadcasts API — typed wrappers over the backend /api/broadcasts endpoints
// (Stage 3A engine + Stage 3B delivery).
import { apiClient, type QueryParams } from './client';
import type { Paginated } from './contacts';

export type BroadcastStatus = 'draft' | 'ready';

export interface Broadcast {
  id: string;
  name: string;
  message: string;
  status: BroadcastStatus;
  recipientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListBroadcastsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: BroadcastStatus;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ResolveResult {
  broadcastId: string;
  totalSelected: number;
  duplicatesRemoved: number;
  ignoredContactIds: string[];
  finalRecipients: number;
  status: BroadcastStatus;
}

export interface EnqueueResult {
  broadcastId: string;
  enqueued: number;
}

export interface BroadcastProgress {
  broadcastId: string;
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  skipped: number;
  percentage: number;
}

export type RecipientStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'skipped';

export interface BroadcastRecipient {
  id: string;
  contactId: string;
  status: RecipientStatus;
  sourceType: 'group' | 'individual';
  sourceId: string;
  name: string;
  businessName: string | null;
  countryCode: string;
  phoneNumber: string;
}

export const broadcastsApi = {
  list: (params: ListBroadcastsParams = {}, signal?: AbortSignal) =>
    apiClient.get<Paginated<Broadcast>>('/broadcasts', params as QueryParams, signal),

  get: (id: string, signal?: AbortSignal) =>
    apiClient.get<Broadcast>(`/broadcasts/${id}`, undefined, signal),

  create: (input: { name: string; message: string }) =>
    apiClient.post<Broadcast>('/broadcasts', input),

  update: (id: string, input: { name?: string; message?: string; status?: BroadcastStatus }) =>
    apiClient.patch<Broadcast>(`/broadcasts/${id}`, input),

  remove: (id: string) => apiClient.del<void>(`/broadcasts/${id}`),

  resolve: (id: string, audience: { groupIds: string[]; contactIds: string[] }) =>
    apiClient.post<ResolveResult>(`/broadcasts/${id}/resolve`, audience),

  send: (id: string) => apiClient.post<EnqueueResult>(`/broadcasts/${id}/send`),

  progress: (id: string, signal?: AbortSignal) =>
    apiClient.get<BroadcastProgress>(`/broadcasts/${id}/progress`, undefined, signal),

  recipients: (id: string, signal?: AbortSignal) =>
    apiClient.get<BroadcastRecipient[]>(`/broadcasts/${id}/recipients`, undefined, signal),
};
