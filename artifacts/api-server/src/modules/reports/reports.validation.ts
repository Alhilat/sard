import { z } from 'zod';

export const createReportSchema = z.object({
  reportable_type: z.enum(['post', 'comment', 'user', 'group', 'blog_article']),
  reportable_id: z.string().uuid(),
  reason: z.string().min(5).max(1000),
});
