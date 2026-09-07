import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(3000).optional(),
  syllabus: z.string().optional(),
  schedule: z.record(z.unknown()).optional(),
  capacity: z.number().int().positive().optional(),
  prerequisites: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  cover_media_id: z.string().uuid().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const addMaterialSchema = z.object({
  media_id: z.string().uuid(),
  title: z.string().max(200).optional(),
  position: z.number().int().min(0).default(0),
});
