import { z } from 'zod';

const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{6})$/, 'color must be a hex value like #25D366');

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(80),
  description: z.string().trim().max(500).nullable().optional(),
  color: hexColor.nullable().optional(),
});

export const updateGroupSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    color: hexColor.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const listGroupsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const addContactsToGroupSchema = z.object({
  contactIds: z.array(z.string().trim().min(1)).min(1).max(1000),
});

export const groupIdParamSchema = z.object({ id: z.string().trim().min(1) });
export const membershipParamSchema = z.object({
  id: z.string().trim().min(1),
  contactId: z.string().trim().min(1),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>;
export type AddContactsToGroupInput = z.infer<typeof addContactsToGroupSchema>;
