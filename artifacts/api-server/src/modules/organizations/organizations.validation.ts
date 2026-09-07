import { z } from 'zod';

export const updateOrgSchema = z.object({
  display_name: z.string().min(2).max(150).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal('')),
});

export const verificationRequestSchema = z.object({
  document_media_id: z.string().uuid(),
});
