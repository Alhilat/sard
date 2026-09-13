import { scheduleCloudSync } from '../db/persistence.mjs';

/**
 * Automatically triggers cloud sync on modifying HTTP operations (POST, PUT, PATCH, DELETE)
 */
export function autoSyncMiddleware(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        scheduleCloudSync();
      }
    });
  }
  next();
}
