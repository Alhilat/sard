import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.mjs';
import { getStatements } from '../db/statements/index.mjs';
import { bannedUserIds } from '../services/cache.mjs';

import { touchUserPresence } from '../services/presence.mjs';

/**
 * Auth Middleware (Strict JWT Verification & Live Presence Tracking)
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  const stmts = getStatements();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRow = stmts.stmtFindUserById.get(decoded.id);
    if (userRow) {
      if (bannedUserIds.has(userRow.id) || userRow.is_banned) {
        return res.status(403).json({
          success: false,
          message: 'تم حظر هذا الحساب لمخالفته شروط وسياسات المنصة',
          is_banned: true,
        });
      }
      req.user = userRow;
      // Real presence: update last activity timestamp in O(1) memory
      touchUserPresence(userRow.id);
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }

  next();
}

/**
 * Guard middleware requiring authenticated user
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  }
  next();
}
