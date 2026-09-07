import { z } from 'zod';

export const createConversationSchema = z.object({
  participant_ids: z.array(z.string().uuid()).min(1).max(9),
});

export const sendMessageSchema = z.object({
  content: z.string().max(5000).optional(),
  media_id: z.string().uuid().optional(),
}).refine((d) => d.content || d.media_id, { message: 'Message must have content or media' });
