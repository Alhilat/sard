import { sign, verify, type Secret, type SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
  roleId: string;
  roleName: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function getSecret(key: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): Secret {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env: ${key}`);
  return val;
}

function getTokenOptions(expiry: string): SignOptions {
  return {
    expiresIn: expiry as SignOptions['expiresIn'],
  };
}

export function signAccessToken(payload: JwtPayload): string {
  return sign(payload, getSecret('JWT_ACCESS_SECRET'), getTokenOptions(process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m'));
}

export function signRefreshToken(payload: JwtPayload): string {
  return sign(payload, getSecret('JWT_REFRESH_SECRET'), getTokenOptions(process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d'));
}

export function verifyAccessToken(token: string): JwtPayload {
  return verify(token, getSecret('JWT_ACCESS_SECRET')) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return verify(token, getSecret('JWT_REFRESH_SECRET')) as JwtPayload;
}

export function signTokenPair(payload: JwtPayload): TokenPair {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}
