import { z } from 'zod';

export const createActivitySchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(3000).optional(),
  location_type: z.enum(['online', 'physical']),
  location_value: z.string().max(500).optional(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  capacity: z.number().int().positive(),
  status: z.enum(['draft', 'published']).default('draft'),
  cover_media_id: z.string().uuid().optional(),
});

export const updateActivitySchema = createActivitySchema.partial();
