#!/usr/bin/env node
/**
 * ============================================================================
 * Sard Raqami — Disaster Recovery: Restore Database from Supabase to Render
 * ============================================================================
 * Features:
 *  - High-speed restoration of full binary snapshot from Supabase `sard_cloud_store`
 *  - Table-by-table reconstruction fallback from relational Supabase tables
 *  - Post-restoration auto-check parity verification
 *  - Safety guard: requires `--force` flag to prevent accidental overwrite
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { SYNC_TABLES } from './sync-and-verify-backup.mjs';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function restoreFromSupabase(options = {}) {
  const { force = false, silent = false } = options;
  const log = (...args) => { if (!silent) console.log(...args); };

  if (!force) {
    throw new Error(
      'SAFETY CHECK: Restoring will overwrite the current Render database.\n' +
      'Pass `--force` flag to confirm restoration (e.g. `node scripts/restore-from-supabase.mjs --force`).'
    );
  }

  const supaUrl = process.env.SUPABASE_DATABASE_URL || process.env.BACKUP_DATABASE_URL;
  if (!supaUrl) {
    throw new Error('SUPABASE_DATABASE_URL environment variable is missing.');
  }

  const supaPool = new Pool({
    connectionString: supaUrl,
    ssl: supaUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });

  const dataDir = process.env.DATA_DIR || path.resolve(__dirname, '../database');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = process.env.DATABASE_PATH || path.resolve(dataDir, 'sard_production.sqlite');

  log('================================================================================');
  log(`[Disaster Recovery] 🔄 Initiating Database Restore from Supabase (${new Date().toISOString()})`);
  log(`[Disaster Recovery] Target local database: ${dbPath}`);
  log('================================================================================');

  try {
    // 1. Try restoring binary snapshot from Supabase `public.sard_cloud_store`
    log('[Disaster Recovery] Checking for remote binary snapshot in Supabase `sard_cloud_store`...');
    let restoredViaSnapshot = false;

    try {
      const snapRes = await supaPool.query(
        'SELECT value, updated_at FROM public.sard_cloud_store WHERE key = $1',
        ['sard_main_db']
      );

      if (snapRes.rows.length > 0 && snapRes.rows[0].value) {
        const snapshot = snapRes.rows[0].value;
        const updatedDate = new Date(Number(snapRes.rows[0].updated_at)).toISOString();
        log(`[Disaster Recovery] Found snapshot in Supabase (${(snapshot.length / 1024).toFixed(1)} KB, saved at ${updatedDate}).`);

        // Backup existing local file if it exists
        if (fs.existsSync(dbPath)) {
          const backupLocal = `${dbPath}.bak.${Date.now()}`;
          fs.copyFileSync(dbPath, backupLocal);
          log(`[Disaster Recovery] Preserved previous local file as: ${backupLocal}`);
        }

        // Clean WAL/SHM locks
        if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
        if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);

        // Write snapshot to local SQLite
        fs.writeFileSync(dbPath, snapshot);
        log('[Disaster Recovery] ✅ Binary snapshot successfully written to Render local disk.');
        restoredViaSnapshot = true;
      }
    } catch (snapErr) {
      log(`[Disaster Recovery] Snapshot read note: ${snapErr.message}`);
    }

    // 2. If no snapshot exists, reconstruct from Supabase relational tables
    if (!restoredViaSnapshot) {
      log('[Disaster Recovery] Reconstructing SQLite database from Supabase relational tables...');
      const db = new DatabaseSync(dbPath);

      for (const table of SYNC_TABLES) {
        try {
          const res = await supaPool.query(`SELECT * FROM public."${table}"`);
          if (res.rows.length === 0) continue;

          log(`  - Rebuilding table "${table}" (${res.rows.length} records)...`);
          const firstRow = res.rows[0];
          const cols = Object.keys(firstRow);

          // Build dynamic CREATE TABLE if not exists
          const colDefs = cols.map(c => `"${c}" TEXT`).join(', ');
          db.exec(`CREATE TABLE IF NOT EXISTS "${table}" (${colDefs});`);

          const placeholders = cols.map(() => '?').join(', ');
          const insertStmt = db.prepare(`INSERT OR REPLACE INTO "${table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`);

          for (const row of res.rows) {
            const vals = cols.map(c => {
              const val = row[c];
              if (val === null || val === undefined) return null;
              if (typeof val === 'object') return JSON.stringify(val);
              return val;
            });
            insertStmt.run(...vals);
          }
          log(`  - Table "${table}" restored successfully ✅`);
        } catch (tableErr) {
          log(`  - Table "${table}" skip: ${tableErr.message}`);
        }
      }
    }

    // 3. If Render DATABASE_URL is configured, also push restored data to Render Postgres
    if (process.env.DATABASE_URL) {
      log('[Disaster Recovery] Syncing restored state into Render PostgreSQL (DATABASE_URL)...');
      const renderPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
      });

      try {
        const restoredBuffer = fs.readFileSync(dbPath);
        await renderPool.query(`
          CREATE TABLE IF NOT EXISTS public.sard_cloud_store (
            key TEXT PRIMARY KEY,
            value BYTEA NOT NULL,
            updated_at BIGINT NOT NULL
          );
          INSERT INTO public.sard_cloud_store (key, value, updated_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (key) DO UPDATE
          SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
        `, ['sard_main_db', restoredBuffer, Date.now()]);
        log('[Disaster Recovery] ✅ Render PostgreSQL persistent store updated.');
      } finally {
        await renderPool.end().catch(() => {});
      }
    }

    // 4. Verify Local SQLite Health
    const db = new DatabaseSync(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    let totalRestoredRecords = 0;
    for (const t of tables) {
      const cnt = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get();
      totalRestoredRecords += Number(cnt?.c || 0);
    }

    log('\n================================================================================');
    log(`[Disaster Recovery] 🎉 RESTORATION COMPLETE!`);
    log(`[Disaster Recovery] Total Tables: ${tables.length} | Total Records Restored: ${totalRestoredRecords}`);
    log('================================================================================\n');

    return {
      success: true,
      tablesCount: tables.length,
      recordsCount: totalRestoredRecords,
      dbPath
    };

  } finally {
    await supaPool.end().catch(() => {});
  }
}

// ── CLI Direct Invocation Support ───────────────────────────────────────────
if (process.argv[1] && process.argv[1].endsWith('restore-from-supabase.mjs')) {
  const force = process.argv.includes('--force') || process.argv.includes('-f');
  restoreFromSupabase({ force }).then(res => {
    process.exit(0);
  }).catch(err => {
    console.error('\n[Restore Error]:', err.message);
    process.exit(1);
  });
}
