import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.mjs';

// In-memory set of revoked session tokens/JTIs (for explicit logouts)
const revokedTokens = new Set();

// 30 days session TTL
const SESSION_TTL = '30d';

/**
 * Creates a cryptographically signed Petra administrative session token.
 * This token survives server restarts and Render sleep/wake cycles.
 */
export function createPetraSession(username) {
  const jti = `petra_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const token = jwt.sign(
    {
      sub: username,
      petraUser: username,
      role: 'petra_admin',
      jti,
    },
    JWT_SECRET,
    { expiresIn: SESSION_TTL }
  );

  return token;
}

/**
 * Verifies a Petra administrative session token using JWT verification.
 */
export function verifyPetraSession(token) {
  if (!token || typeof token !== 'string') return null;
  if (revokedTokens.has(token)) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && (decoded.role === 'petra_admin' || decoded.role === 'admin')) {
      if (decoded.jti && revokedTokens.has(decoded.jti)) return null;
      return {
        username: decoded.petraUser || decoded.sub || 'petra',
        role: decoded.role,
        jti: decoded.jti,
      };
    }
  } catch (err) {
    return null;
  }
  return null;
}

/**
 * Revokes a session token so it cannot be used again
 */
export function revokePetraSession(token) {
  if (!token) return;
  revokedTokens.add(token);
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.jti) {
      revokedTokens.add(decoded.jti);
    }
  } catch (err) {}
}
