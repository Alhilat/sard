import { getStatements } from '../db/statements/index.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';

export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'الآن';
  const diffSec = Math.floor((Date.now() - Number(timestamp)) / 1000);
  if (diffSec < 60) return 'الآن';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  return `منذ ${diffDays} يوم`;
}

export function createNotification({ userId, actorId, type, title, content, link = '' }) {
  if (!userId || (actorId && userId === actorId)) return; // Don't self-notify
  try {
    const stmts = getStatements();
    const notifId = `notif_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    stmts.stmtInsertNotification.run(notifId, userId, actorId || null, type, title, content, link, Date.now());
    scheduleCloudSync();
  } catch (err) {
    console.error('[Notification] Error creating notification:', err.message);
  }
}
