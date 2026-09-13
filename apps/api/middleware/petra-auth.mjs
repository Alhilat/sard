import { PETRA_USER } from '../config/env.mjs';
import { verifyPetraSession } from '../services/petra-sessions.mjs';

/**
 * Petra Central Control Gate Middleware (Strict Session Verification)
 */
export function authenticatePetra(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const validSession = verifyPetraSession(token);
  if (!validSession) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح لك بالدخول إلى بوابة بترا للتحكم المركزي. الجلسة غير صالحة أو منتهية الصلاحية.',
    });
  }

  req.petraUser = validSession.username || PETRA_USER;
  next();
}

