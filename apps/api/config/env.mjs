import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = Number(process.env.PORT || 5000);
export const HOST = '0.0.0.0';
export const JWT_SECRET = process.env.JWT_SECRET || 'sard-raqami-ultra-speed-secret-2026';
export const PETRA_USER = (process.env.PETRA_USER || 'petra').trim();
export const PETRA_PASS = (process.env.PETRA_PASS || 'petra2026').trim();

export function getPetraEnvCredentials() {
  return {
    username: (process.env.PETRA_USER || PETRA_USER || 'petra').trim(),
    password: (process.env.PETRA_PASS || PETRA_PASS || 'petra2026').trim(),
    isFromEnv: Boolean(process.env.PETRA_USER || process.env.PETRA_PASS),
  };
}

export const DATA_DIR = process.env.DATA_DIR || (process.env.DATABASE_PATH ? path.dirname(process.env.DATABASE_PATH) : null) || path.resolve(__dirname, '../../../database');
export const DATABASE_PATH = process.env.DATABASE_PATH || path.resolve(DATA_DIR, 'sard_production.sqlite');

export const DATABASE_URL = process.env.DATABASE_URL || null;
export const SUPABASE_DATABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.BACKUP_DATABASE_URL || null;
export const BACKUP_SECRET_KEY = process.env.BACKUP_SECRET_KEY || null;

export const STATIC_DIR = path.resolve(__dirname, '../../web/dist/public');
