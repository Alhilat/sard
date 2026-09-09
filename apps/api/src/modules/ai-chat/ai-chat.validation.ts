import { z } from 'zod';

export const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
});
