import fs from 'node:fs';
import pg from 'pg';
const { Pool } = pg;
import { DATABASE_URL, SUPABASE_DATABASE_URL } from '../config/env.mjs';

let pgPool = null;
let isCloudPersistenceActive = false;
let isDirty = false;
let syncTimeout = null;
let currentDb = null;
let currentDbPath = null;
let activeProviderName = 'Local SQLite';
let periodicSyncInterval = null;

export function getPersistenceStatus() {
  return {
    isActive: isCloudPersistenceActive,
    provider: activeProviderName,
    isDirty
  };
}

export function setDatabaseInstance(db, dbPath) {
  currentDb = db;
  currentDbPath = dbPath;
}

export async function flushToPostgres(db = currentDb, dbPath = currentDbPath) {
  if (!isCloudPersistenceActive || !pgPool) return;
  try {
    if (db) {
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    }
    if (!dbPath || !fs.existsSync(dbPath)) return;
    const data = fs.readFileSync(dbPath);
    const now = Date.now();
    await pgPool.query(`
      INSERT INTO public.sard_cloud_store (key, value, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
    `, ['sard_main_db', data, now]);
    isDirty = false;
  } catch (err) {
    console.error('[Cloud Database] Error syncing to Cloud PostgreSQL:', err.message);
  }
}

export function scheduleCloudSync(db = currentDb, dbPath = currentDbPath) {
  isDirty = true;
  if (!isCloudPersistenceActive) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    flushToPostgres(db, dbPath).catch(() => {});
  }, 1200);
}

export async function initPersistence(dbPath) {
  currentDbPath = dbPath;
  let primaryConnected = false;
  let primaryHasSnapshot = false;

  if (DATABASE_URL) {
    try {
      console.log('[Cloud Database] DATABASE_URL detected. Connecting to Cloud PostgreSQL...');
      pgPool = new Pool({
        connectionString: DATABASE_URL,
        ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });

      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS public.sard_cloud_store (
          key TEXT PRIMARY KEY,
          value BYTEA NOT NULL,
          updated_at BIGINT NOT NULL
        );
      `);

      const res = await pgPool.query('SELECT value, updated_at FROM public.sard_cloud_store WHERE key = $1', ['sard_main_db']);
      if (res.rows.length > 0 && res.rows[0].value) {
        const snapshot = res.rows[0].value;
        const updatedDate = new Date(Number(res.rows[0].updated_at)).toISOString();
        console.log(`[Cloud Database] Found remote snapshot (${snapshot.length} bytes, updated at ${updatedDate}). Restoring...`);

        if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
        if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');

        fs.writeFileSync(dbPath, snapshot);
        console.log('[Cloud Database] ✅ Database state successfully restored from Cloud PostgreSQL! Zero data lost across sleeps.');
        primaryHasSnapshot = true;
      } else {
        console.log('[Cloud Database] No previous snapshot in Cloud PostgreSQL. Fresh store initialized.');
      }

      isCloudPersistenceActive = true;
      primaryConnected = true;

      activeProviderName = (DATABASE_URL.includes('supabase') || DATABASE_URL.includes('pooler.')) ? 'Supabase PostgreSQL' :
        DATABASE_URL.includes('neon.tech') ? 'Neon PostgreSQL' :
        (DATABASE_URL.includes('render.com') || DATABASE_URL.includes('dpg-')) ? 'Render PostgreSQL' : 'Cloud PostgreSQL';

    } catch (err) {
      console.error('[Cloud Database] Warning: Could not connect to primary Cloud PostgreSQL:', err.message);
      console.log('[Cloud Database] Falling back to local SQLite or backup target.');
      if (pgPool) {
        await pgPool.end().catch(() => {});
        pgPool = null;
      }
      isCloudPersistenceActive = false;
    }
  }

  // Periodic safeguard sync every 30 seconds if dirty
  if (!periodicSyncInterval) {
    periodicSyncInterval = setInterval(() => {
      if (isDirty && isCloudPersistenceActive) {
        flushToPostgres().catch(() => {});
      }
    }, 30000);
  }

  return {
    primaryConnected,
    primaryHasSnapshot,
    isCloudPersistenceActive
  };
}

export async function promoteSupabasePersistence(supaUrl) {
  try {
    console.log('[Auto-Persistence] 🚀 Primary database is down/expired. Promoting Supabase to ACTIVE persistence target for live sync...');
    if (pgPool) {
      await pgPool.end().catch(() => {});
    }
    pgPool = new Pool({
      connectionString: supaUrl,
      ssl: supaUrl.includes('localhost') ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS public.sard_cloud_store (
        key TEXT PRIMARY KEY,
        value BYTEA NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `);
    isCloudPersistenceActive = true;
    activeProviderName = 'Supabase PostgreSQL (Active Failover Target)';
    console.log('[Auto-Persistence] ✅ Live persistence to Supabase is ACTIVE. All future changes will be saved to Supabase!');
    return true;
  } catch (err) {
    console.error('[Auto-Persistence] Warning: Could not activate live persistence with Supabase:', err.message);
    return false;
  }
}

export async function closePersistence() {
  if (periodicSyncInterval) {
    clearInterval(periodicSyncInterval);
    periodicSyncInterval = null;
  }
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  if (isCloudPersistenceActive) {
    await flushToPostgres();
  }
  if (pgPool) {
    await pgPool.end().catch(() => {});
    pgPool = null;
  }
  isCloudPersistenceActive = false;
}
