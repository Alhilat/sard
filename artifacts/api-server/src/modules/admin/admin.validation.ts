import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned']),
  reason: z.string().max(500).optional(),
});

export const updateOrgStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'verified']),
});

export const listUsersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  q: z.string().optional(),
});
