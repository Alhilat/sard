import prisma from '../../lib/prisma';
import { parsePagination, buildPagination } from '../../utils/paginate';

export async function listNotifications(userId: string, query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const unreadOnly = query['unread'] === 'true';
  const where = { recipient_id: userId, ...(unreadOnly ? { is_read: false } : {}) };
  const [notifications, total] = await Promise.all([
    prisma.notifications.findMany({ where, orderBy: { created_at: 'desc' }, skip, take }),
    prisma.notifications.count({ where }),
  ]);
  return { notifications, pagination: buildPagination(page, limit, total) };
}

export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notifications.updateMany({
    where: { id: notificationId, recipient_id: userId },
    data: { is_read: true, read_at: new Date() },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notifications.updateMany({
    where: { recipient_id: userId, is_read: false },
    data: { is_read: true, read_at: new Date() },
  });
}

export async function getPreferences(userId: string) {
  return prisma.notification_preferences.upsert({
    where: { user_id: userId },
    create: { user_id: userId },
    update: {},
  });
}

export async function updatePreferences(userId: string, data: { in_app_enabled?: boolean; email_enabled?: boolean }) {
  return prisma.notification_preferences.upsert({
    where: { user_id: userId },
    create: { user_id: userId, ...data },
    update: { ...data, updated_at: new Date() },
  });
}

export async function createNotification(recipientId: string, type: string, payload: Record<string, unknown>) {
  return prisma.notifications.create({
    data: { recipient_id: recipientId, type, payload: payload as any },
  });
}
