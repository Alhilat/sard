import prisma from '../../lib/prisma';
import { NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { parsePagination, buildPagination } from '../../utils/paginate';

export async function listConversations(userId: string, query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { user_id: userId };
  const [conversations, total] = await Promise.all([
    prisma.ai_chat_conversations.findMany({ where, orderBy: { started_at: 'desc' }, skip, take }),
    prisma.ai_chat_conversations.count({ where }),
  ]);
  return { conversations, pagination: buildPagination(page, limit, total) };
}

export async function createConversation(userId: string, title?: string) {
  return prisma.ai_chat_conversations.create({ data: { user_id: userId, title: title ?? 'New Chat' } });
}

export async function getConversation(conversationId: string, userId: string, query: Record<string, string>) {
  const convo = await prisma.ai_chat_conversations.findUnique({ where: { id: conversationId } });
  if (!convo) throw new NotFoundError('Conversation');
  if (convo.user_id !== userId) throw new ForbiddenError();
  const { skip, take, page, limit } = parsePagination(query);
  const [messages, total] = await Promise.all([
    prisma.ai_chat_messages.findMany({ where: { conversation_id: conversationId }, orderBy: { created_at: 'asc' }, skip, take }),
    prisma.ai_chat_messages.count({ where: { conversation_id: conversationId } }),
  ]);
  return { conversation: convo, messages, pagination: buildPagination(page, limit, total) };
}

export async function sendMessage(conversationId: string, userId: string, content: string) {
  const convo = await prisma.ai_chat_conversations.findUnique({ where: { id: conversationId } });
  if (!convo) throw new NotFoundError('Conversation');
  if (convo.user_id !== userId) throw new ForbiddenError();
  await prisma.ai_chat_messages.create({ data: { conversation_id: conversationId, role: 'user', content } });
  // Stub AI response — replace with real LLM call in production
  const aiResponse = `Echo: ${content}`;
  const aiMessage = await prisma.ai_chat_messages.create({ data: { conversation_id: conversationId, role: 'assistant', content: aiResponse } });
  return { assistant_message: aiMessage };
}

export async function deleteConversation(conversationId: string, userId: string) {
  const convo = await prisma.ai_chat_conversations.findUnique({ where: { id: conversationId } });
  if (!convo) throw new NotFoundError('Conversation');
  if (convo.user_id !== userId) throw new ForbiddenError();
  await prisma.ai_chat_messages.deleteMany({ where: { conversation_id: conversationId } });
  await prisma.ai_chat_conversations.delete({ where: { id: conversationId } });
  return { message: 'Conversation deleted' };
}
