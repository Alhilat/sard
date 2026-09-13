import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { DATA_DIR, DATABASE_PATH } from '../config/env.mjs';
import { initSchema } from './schema.mjs';
import {
  initPersistence,
  flushToPostgres,
  setDatabaseInstance,
  closePersistence,
  getPersistenceStatus
} from './persistence.mjs';
import { checkAndAutoRecover } from './disaster-recovery.mjs';

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    throw new Error('Database has not been initialized yet. Call initDatabase() first.');
  }
  return dbInstance;
}

export async function initDatabase() {
  if (dbInstance) return dbInstance;

  // Ensure database directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 1. Initialize Cloud PostgreSQL Persistence (if configured)
  const persistenceState = await initPersistence(DATABASE_PATH);

  // 2. Automated Disaster Recovery check from Supabase
  await checkAndAutoRecover(DATABASE_PATH, persistenceState);

  // 3. Initialize SQLite Production Engine
  console.log(`[Database] Initializing SQLite production engine at: ${DATABASE_PATH}`);
  dbInstance = new DatabaseSync(DATABASE_PATH);

  // 4. High-concurrency WAL mode and memory settings
  dbInstance.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA cache_size = -64000;
    PRAGMA temp_store = MEMORY;
    PRAGMA foreign_keys = ON;
  `);

  // 5. Initialize Schema
  initSchema(dbInstance);

  // 6. Link persistence to SQLite instance
  setDatabaseInstance(dbInstance, DATABASE_PATH);

  // 7. Flush initial snapshot if persistence is active
  const status = getPersistenceStatus();
  if (status.isActive) {
    flushToPostgres(dbInstance, DATABASE_PATH).then(() => {
      console.log('[Cloud Database] ✅ Initial snapshot successfully synced to Cloud PostgreSQL.');
    }).catch((err) => {
      console.error('[Cloud Database] Initial snapshot sync warning:', err.message);
    });
  }

  return dbInstance;
}

export async function closeDatabase() {
  await closePersistence();
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {}
    dbInstance = null;
  }
}

export { DATABASE_PATH };
