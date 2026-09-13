import { PETRA_USER } from '../config/env.mjs';

/**
 * Petra Central Control Gate Middleware
 */
export function authenticatePetra(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || !token.startsWith('petra_session_')) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح لك بالدخول إلى بوابة بترا للتحكم المركزي.',
    });
  }
  req.petraUser = PETRA_USER;
  next();
}
