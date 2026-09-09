import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string().min(2).max(250),
  slug: z.string().min(2).max(280).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1),
  cover_media_id: z.string().uuid().optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  featured: z.boolean().default(false),
});

export const updateArticleSchema = createArticleSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
});
