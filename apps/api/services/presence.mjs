/**
 * Real-Time User Presence & Activity Engine (محرك الحضور اللحظي لمستخدمي سرد)
 * Tracks genuine active user status (نشط الآن) with sub-millisecond O(1) in-memory precision.
 */

import { getStatements } from '../db/statements/index.mjs';

// In-memory high-frequency presence map: userId -> lastSeenTimestamp (ms)
const userPresenceMap = new Map();

// Pending DB writes to minimize SQLite disk churn
const pendingDbSync = new Set();
let dbSyncTimer = null;

// Threshold for "Online / نشط الآن": 75 seconds (accommodates 30s heartbeat interval + network delay)
export const ONLINE_THRESHOLD_MS = 75 * 1000;

/**
 * Record user activity (triggered on any authenticated request or heartbeat)
 */
export function touchUserPresence(userId) {
  if (!userId) return;
  const now = Date.now();
  userPresenceMap.set(userId, now);
  pendingDbSync.add(userId);

  // Debounced flush to SQLite
  if (!dbSyncTimer) {
    dbSyncTimer = setTimeout(flushPresenceToDb, 10000);
  }
}

/**
 * Explicitly mark user as offline (e.g. on logout or tab close)
 */
export function setUserOffline(userId) {
  if (!userId) return;
  const offlineTimestamp = Date.now() - (ONLINE_THRESHOLD_MS + 5000);
  userPresenceMap.set(userId, offlineTimestamp);
  pendingDbSync.add(userId);
}

/**
 * Check whether a user is currently active (نشط الآن)
 */
export function isUserOnline(userId) {
  if (!userId) return false;
  const lastSeen = userPresenceMap.get(userId);
  if (!lastSeen) return false;
  return Date.now() - lastSeen < ONLINE_THRESHOLD_MS;
}

/**
 * Get raw last seen timestamp for a user
 */
export function getUserLastSeen(userId) {
  if (!userId) return 0;
  return userPresenceMap.get(userId) || 0;
}

/**
 * Format real human-readable Arabic status for a user
 * e.g. "نشط الآن", "نشط منذ 5 دقائق", "نشط منذ ساعة", "غير متصل"
 */
export function formatPresenceStatus(userId) {
  if (!userId) return 'غير متصل';

  const lastSeen = userPresenceMap.get(userId);
  if (!lastSeen) {
    return 'غير متصل';
  }

  const diffMs = Date.now() - lastSeen;

  if (diffMs < ONLINE_THRESHOLD_MS) {
    return 'نشط الآن';
  }

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 2) {
    return 'نشط قبل دقيقة';
  }
  if (minutes < 11) {
    return `نشط منذ ${minutes} دقائق`;
  }
  if (minutes < 60) {
    return `نشط منذ ${minutes} دقيقة`;
  }

  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours === 1) {
    return 'نشط منذ ساعة';
  }
  if (hours === 2) {
    return 'نشط منذ ساعتين';
  }
  if (hours < 11) {
    return `نشط منذ ${hours} ساعات`;
  }
  if (hours < 24) {
    return `نشط منذ ${hours} ساعة`;
  }

  return 'غير متصل';
}

/**
 * Batch flush presence timestamps to SQLite
 */
function flushPresenceToDb() {
  dbSyncTimer = null;
  if (pendingDbSync.size === 0) return;

  try {
    const stmts = getStatements();
    if (stmts && stmts.stmtUpdateUserLastSeen) {
      for (const userId of pendingDbSync) {
        const timestamp = userPresenceMap.get(userId);
        if (timestamp) {
          stmts.stmtUpdateUserLastSeen.run(timestamp, userId);
        }
      }
    }
  } catch (err) {
    // Non-fatal, presence stays accurate in memory
  } finally {
    pendingDbSync.clear();
  }
}
