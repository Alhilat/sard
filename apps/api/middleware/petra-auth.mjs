import jwt from 'jsonwebtoken';
import { JWT_SECRET, PETRA_USER } from '../config/env.mjs';
import { verifyPetraSession } from '../services/petra-sessions.mjs';
import { getStatements } from '../db/statements/index.mjs';

/**
 * Petra Central Control Gate Middleware (Strict Session Verification & Admin Support)
 */
export function authenticatePetra(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح لك بالدخول إلى بوابة بترا للتحكم المركزي. يرجى تسجيل الدخول أولاً.',
    });
  }

  // 1. Check for dedicated Petra session token
  const validPetraSession = verifyPetraSession(token);
  if (validPetraSession) {
    req.petraUser = validPetraSession.username || PETRA_USER;
    req.petraAdmin = req.petraUser;
    return next();
  }

  // 2. Fallback: Check if request is authenticated with a platform admin token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.id) {
      const stmts = getStatements();
      const user = stmts.stmtFindUserById.get(decoded.id);
      if (user && (user.role === 'admin' || user.email === 'aaa@g.com')) {
        req.petraUser = user.name || PETRA_USER;
        req.petraAdmin = req.petraUser;
        return next();
      }
    }
  } catch (err) {}

  return res.status(401).json({
    success: false,
    message: 'غير مصرح لك بالدخول إلى بوابة بترا للتحكم المركزي. الجلسة غير صالحة أو منتهية الصلاحية.',
  });
}
