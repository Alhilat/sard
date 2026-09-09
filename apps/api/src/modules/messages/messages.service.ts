import prisma from '../../lib/prisma';
import { NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { parsePagination, buildPagination } from '../../utils/paginate';

export async function listConversations(userId: string, query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const participantConvos = await prisma.message_conversation_participants.findMany({
    where: { user_id: userId },
    select: { conversation_id: true },
  });
  const conversationIds = participantConvos.map((p) => p.conversation_id);
  const [conversations, total] = await Promise.all([
    prisma.message_conversations.findMany({
      where: { id: { in: conversationIds } },
      include: {
        message_conversation_participants: { include: { users: { select: { id: true, email: true } } } },
        messages: { orderBy: { sent_at: 'desc' }, take: 1 },
      },
      orderBy: { created_at: 'desc' }, skip, take,
    }),
    prisma.message_conversations.count({ where: { id: { in: conversationIds } } }),
  ]);
  return { conversations, pagination: buildPagination(page, limit, total) };
}

export async function createConversation(userId: string, participantIds: string[]) {
  const allParticipants = Array.from(new Set([userId, ...participantIds]));
  const conversation = await prisma.message_conversations.create({ data: {} });
  await prisma.message_conversation_participants.createMany({
    data: allParticipants.map((id) => ({ conversation_id: conversation.id, user_id: id })),
  });
  return conversation;
}

export async function getConversation(conversationId: string, userId: string, query: Record<string, string>) {
  const member = await prisma.message_conversation_participants.findFirst({ where: { conversation_id: conversationId, user_id: userId } });
  if (!member) throw new ForbiddenError();
  const { skip, take, page, limit } = parsePagination(query);
  const [messages, total] = await Promise.all([
    prisma.messages.findMany({ where: { conversation_id: conversationId }, orderBy: { sent_at: 'desc' }, skip, take }),
    prisma.messages.count({ where: { conversation_id: conversationId } }),
  ]);
  return { messages, pagination: buildPagination(page, limit, total) };
}

export async function sendMessage(conversationId: string, senderId: string, data: { content?: string; media_id?: string }) {
  const member = await prisma.message_conversation_participants.findFirst({ where: { conversation_id: conversationId, user_id: senderId } });
  if (!member) throw new ForbiddenError();
  return prisma.messages.create({ data: { conversation_id: conversationId, sender_id: senderId, ...data } });
}
