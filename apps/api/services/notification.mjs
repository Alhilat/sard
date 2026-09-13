import { getStatements } from '../db/statements/index.mjs';
import { scheduleCloudSync } from '../db/persistence.mjs';

export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'منذ قليل';
  const num = Number(timestamp);
  if (isNaN(num) || num <= 0) return 'منذ قليل';
  const timeMs = num < 1e11 ? num * 1000 : num;
  const diffSec = Math.max(0, Math.floor((Date.now() - timeMs) / 1000));

  if (diffSec < 45) return 'الآن';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return 'منذ دقيقة';
  if (diffMin === 2) return 'منذ دقيقتين';
  if (diffMin >= 3 && diffMin <= 10) return `منذ ${diffMin} دقائق`;
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return 'منذ ساعة';
  if (diffHours === 2) return 'منذ ساعتين';
  if (diffHours >= 3 && diffHours <= 10) return `منذ ${diffHours} ساعات`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'أمس';
  if (diffDays === 2) return 'منذ يومين';
  if (diffDays >= 3 && diffDays <= 10) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) return `منذ ${diffDays} يوماً`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'منذ شهر';
  if (diffMonths === 2) return 'منذ شهرين';
  if (diffMonths < 12) return `منذ ${diffMonths} أشهر`;

  return 'منذ أكثر من سنة';
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
