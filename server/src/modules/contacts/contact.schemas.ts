import { z } from 'zod';

/**
 * Zod schemas for the Contacts API. These are the single source of truth for
 * request validation; the inferred types flow through the service/repository.
 */

const phoneNumber = z
  .string()
  .trim()
  .regex(/^\d{7,15}$/, 'phoneNumber must be 7–15 digits (no spaces or symbols)');

const countryCode = z
  .string()
  .trim()
  .regex(/^\+\d{1,4}$/, 'countryCode must look like +91');

/** Query booleans arrive as strings ("true"/"false"); coerce them safely. */
const queryBoolean = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => v === true || v === 'true' || v === '1')
  .optional();

export const createContactSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(120),
  phoneNumber,
  countryCode: countryCode.default('+91'),
  businessName: z.string().trim().max(160).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  state: z.string().trim().max(80).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  isBlocked: z.boolean().optional(),
  isOptedOut: z.boolean().optional(),
});

export const updateContactSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    phoneNumber: phoneNumber.optional(),
    countryCode: countryCode.optional(),
    businessName: z.string().trim().max(160).nullable().optional(),
    city: z.string().trim().max(80).nullable().optional(),
    state: z.string().trim().max(80).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    isBlocked: z.boolean().optional(),
    isOptedOut: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const listContactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  sortBy: z
    .enum(['name', 'createdAt', 'updatedAt', 'lastInteractionAt', 'engagementScore', 'city'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  // filters
  isBlocked: queryBoolean,
  isOptedOut: queryBoolean,
  groupId: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
});

export const idParamSchema = z.object({ id: z.string().trim().min(1) });

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;
