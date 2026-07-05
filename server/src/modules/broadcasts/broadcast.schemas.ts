import { z } from 'zod';

/**
 * Zod schemas for the Broadcasts API. Single source of truth for validation;
 * inferred types flow through the service and repository.
 */

export const broadcastStatusSchema = z.enum(['draft', 'ready']);

export const createBroadcastSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(120),
  message: z.string().trim().min(1, 'message is required').max(4096),
});

export const updateBroadcastSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    message: z.string().trim().min(1).max(4096).optional(),
    status: broadcastStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const listBroadcastsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  status: broadcastStatusSchema.optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/** Audience selection for POST /broadcasts/:id/resolve. */
export const resolveAudienceSchema = z
  .object({
    groupIds: z.array(z.string().trim().min(1)).max(1000).default([]),
    contactIds: z.array(z.string().trim().min(1)).max(50000).default([]),
  })
  .refine((data) => data.groupIds.length > 0 || data.contactIds.length > 0, {
    message: 'Provide at least one groupId or contactId',
  });

export const idParamSchema = z.object({ id: z.string().trim().min(1) });

export type CreateBroadcastInput = z.infer<typeof createBroadcastSchema>;
export type UpdateBroadcastInput = z.infer<typeof updateBroadcastSchema>;
export type ListBroadcastsQuery = z.infer<typeof listBroadcastsQuerySchema>;
export type ResolveAudienceInput = z.infer<typeof resolveAudienceSchema>;
