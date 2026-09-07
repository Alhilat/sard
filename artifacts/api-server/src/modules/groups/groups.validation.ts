import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['public', 'private']).default('public'),
});

export const updateGroupSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['public', 'private']).optional(),
});

export const updateMemberSchema = z.object({
  role: z.enum(['member', 'moderator']).optional(),
  status: z.enum(['active', 'removed']).optional(),
});
