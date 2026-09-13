/**
 * In-Memory Fast Caches & Metrics (Sub-Millisecond O(1) Speed)
 */
export const bannedUserIds = new Set();
export const userCache = new Map(); // id -> user object

export const metrics = {
  startedAt: Date.now(),
  totalRequests: 0,
  totalQueries: 0,
  totalQueryTimeMs: 0,
};

export function recordMetric(durationMs) {
  metrics.totalRequests++;
  metrics.totalQueryTimeMs += durationMs;
}

export function loadBannedUsers(db) {
  try {
    const bannedRows = db.prepare('SELECT id FROM users WHERE is_banned = 1').all();
    bannedUserIds.clear();
    for (const row of bannedRows) {
      bannedUserIds.add(row.id);
    }
  } catch (err) {
    console.error('[Cache] Error loading banned users:', err.message);
  }
}
