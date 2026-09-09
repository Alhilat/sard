import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  visibility: z.enum(['public', 'followers', 'group']).default('public'),
  group_id: z.string().uuid().optional(),
  media_ids: z.array(z.string().uuid()).optional(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  visibility: z.enum(['public', 'followers', 'group']).optional(),
});

export const addCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parent_comment_id: z.string().uuid().optional(),
});

export const likeableParamSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['post', 'comment', 'blog_article']).optional(),
});
