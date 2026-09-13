import crypto from 'node:crypto';

// In-memory registry of active, cryptographically signed Petra administrative sessions
const petraSessions = new Map();

// 24 hours TTL
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function createPetraSession(username) {
  const randomHex = crypto.randomBytes(24).toString('hex');
  const token = `petra_session_${Date.now()}_${randomHex}`;
  const now = Date.now();

  petraSessions.set(token, {
    username,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });

  return token;
}

export function verifyPetraSession(token) {
  if (!token || typeof token !== 'string') return null;

  const session = petraSessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    petraSessions.delete(token);
    return null;
  }

  return session;
}

export function revokePetraSession(token) {
  if (token) {
    petraSessions.delete(token);
  }
}
