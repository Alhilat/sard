#!/usr/bin/env node
/**
 * ============================================================================
 * Sard Raqami — Render to Supabase Automated Sync & Auto-Check Data Engine
 * ============================================================================
 * Features:
 *  - Ultra-fast streaming batch synchronization from Render SQLite/PG to Supabase PG
 *  - Full binary snapshot replication to `sard_cloud_store` for zero-loss disaster recovery
 *  - Full relational table replication across all 19 platform tables
 *  - Post-sync automated data parity verification (Row counts & Max timestamps)
 *  - Persisted audit history in `backup_audit_logs`
 *  - CLI Flags: --verify-only, --dry-run, --table <name>, --json
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ordered by foreign key dependency hierarchy
export const SYNC_TABLES = [
  'users',
  'groups',
  'activities',
  'courses',
  'conversations',
  'posts',
  'comments',
  'post_likes',
  'group_members',
  'user_follows',
  'activity_registrations',
  'course_enrollments',
  'notifications',
  'org_members',
  'reports',
  'direct_messages',
  'course_chat_settings',
  'course_chat_messages',
  'petra_audit_logs'
];

// Supabase PostgreSQL DDL for tables if they don't already exist
export const TABLE_SCHEMAS_SQL = `
  CREATE TABLE IF NOT EXISTS public.sard_cloud_store (
    key TEXT PRIMARY KEY,
    value BYTEA NOT NULL,
    updated_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.backup_audit_logs (
    id TEXT PRIMARY KEY,
    trigger_type TEXT NOT NULL,
    status TEXT NOT NULL,
    tables_synced INTEGER DEFAULT 0,
    total_records INTEGER DEFAULT 0,
    discrepancies JSONB DEFAULT '[]'::jsonb,
    duration_ms INTEGER DEFAULT 0,
    details TEXT DEFAULT '',
    created_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'individual',
    phone TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    location TEXT DEFAULT 'المملكة العربية السعودية',
    country TEXT DEFAULT 'المملكة العربية السعودية',
    join_date TEXT NOT NULL,
    verified INTEGER DEFAULT 0,
    is_banned INTEGER DEFAULT 0,
    ban_reason TEXT DEFAULT '',
    created_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    group_id TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    created_at BIGINT NOT NULL,
    timestamp_text TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at BIGINT NOT NULL,
    timestamp_text TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.post_likes (
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    PRIMARY KEY (post_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS public.groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT DEFAULT '',
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'عام',
    privacy TEXT DEFAULT 'عام',
    members_count INTEGER DEFAULT 1,
    posts_count INTEGER DEFAULT 0,
    cover_gradient TEXT DEFAULT '',
    accent_color TEXT DEFAULT '',
    rules TEXT DEFAULT '[]',
    creator_id TEXT NOT NULL,
    created_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.group_members (
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'عضو',
    joined_at BIGINT NOT NULL,
    PRIMARY KEY (group_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS public.petra_audit_logs (
    id TEXT PRIMARY KEY,
    admin_user TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details TEXT DEFAULT '',
    created_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.user_follows (
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    PRIMARY KEY (follower_id, following_id)
  );

  CREATE TABLE IF NOT EXISTS public.activities (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'عام',
    date TEXT NOT NULL,
    time TEXT DEFAULT '',
    location TEXT DEFAULT '',
    location_type TEXT DEFAULT 'in_person',
    capacity INTEGER DEFAULT 100,
    attendees_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'متاح للتسجيل',
    created_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.activity_registrations (
    activity_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    PRIMARY KEY (activity_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    title TEXT NOT NULL,
    tagline TEXT DEFAULT '',
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'تقنية',
    level TEXT DEFAULT 'مبتدئ',
    duration TEXT DEFAULT '',
    total_hours INTEGER DEFAULT 0,
    lectures INTEGER DEFAULT 0,
    students INTEGER DEFAULT 0,
    rating REAL DEFAULT 5.0,
    price TEXT DEFAULT 'مجاني',
    created_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.course_enrollments (
    course_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    created_at BIGINT NOT NULL,
    PRIMARY KEY (course_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    actor_id TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    link TEXT DEFAULT '',
    is_read INTEGER DEFAULT 0,
    created_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.org_members (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'عضو',
    status TEXT NOT NULL DEFAULT 'active',
    created_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    last_message TEXT DEFAULT '',
    updated_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.direct_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.course_chat_settings (
    course_id TEXT PRIMARY KEY,
    permission_mode TEXT DEFAULT 'all',
    pinned_announcement TEXT DEFAULT '',
    slow_mode_seconds INTEGER DEFAULT 0,
    updated_at BIGINT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.course_chat_messages (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'student',
    content TEXT NOT NULL,
    is_announcement INTEGER DEFAULT 0,
    created_at BIGINT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_supa_posts_created_at ON public.posts(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_supa_comments_post_id ON public.comments(post_id, created_at ASC);
  CREATE INDEX IF NOT EXISTS idx_supa_users_email ON public.users(email);
  CREATE INDEX IF NOT EXISTS idx_supa_direct_messages_conv ON public.direct_messages(conversation_id, created_at ASC);
`;

/**
 * Automatically syncs table columns so any missing columns in Supabase are added dynamically
 */
export async function syncTableColumns(supaClient, db, tableName) {
  try {
    const pragmaCols = db.prepare(`PRAGMA table_info("${tableName}")`).all();
    const supaColsRes = await supaClient.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
      [tableName]
    );
    const existingSupaCols = new Set(supaColsRes.rows.map(r => r.column_name));

    for (const col of pragmaCols) {
      if (!existingSupaCols.has(col.name)) {
        let pgType = 'TEXT';
        if (col.type === 'INTEGER') pgType = 'BIGINT DEFAULT 0';
        else if (col.type === 'REAL') pgType = 'DOUBLE PRECISION DEFAULT 0';

        await supaClient.query(`ALTER TABLE public."${tableName}" ADD COLUMN IF NOT EXISTS "${col.name}" ${pgType};`);
      }
    }

    // Relax NOT NULL constraints on legacy Supabase columns not present in source database
    const notNullColsRes = await supaClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1 AND is_nullable = 'NO'
    `, [tableName]);

    const sqliteColNames = new Set(pragmaCols.map(c => c.name));
    for (const row of notNullColsRes.rows) {
      if (!sqliteColNames.has(row.column_name) && row.column_name !== 'id') {
        try {
          await supaClient.query(`ALTER TABLE public."${tableName}" ALTER COLUMN "${row.column_name}" DROP NOT NULL;`);
        } catch {}
      }
    }
  } catch (err) {
    console.warn(`[Sync Engine] Column migration note for "${tableName}": ${err.message}`);
  }
}

/**
 * Locate the primary SQLite database or download it from Render Postgres
 */
export async function getPrimarySqliteDb() {
  const localCandidates = [
    process.env.DATABASE_PATH,
    path.resolve(__dirname, '../database/sard_production.sqlite'),
    path.resolve(process.cwd(), 'database/sard_production.sqlite'),
    path.resolve(process.env.DATA_DIR || '', 'sard_production.sqlite')
  ].filter(Boolean);

  for (const candidate of localCandidates) {
    if (fs.existsSync(candidate)) {
      return {
        db: new DatabaseSync(candidate),
        path: candidate,
        isTemp: false
      };
    }
  }

  // Fallback: If not found on local disk, pull snapshot from Render PostgreSQL (DATABASE_URL)
  if (process.env.DATABASE_URL) {
    console.log('[Sync Engine] Local SQLite not on disk. Fetching latest snapshot from Render DATABASE_URL...');
    const renderPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });

    try {
      const res = await renderPool.query('SELECT value FROM public.sard_cloud_store WHERE key = $1', ['sard_main_db']);
      if (res.rows.length > 0 && res.rows[0].value) {
        const tempPath = path.resolve('/tmp', `sard_sync_${Date.now()}.sqlite`);
        fs.writeFileSync(tempPath, res.rows[0].value);
        console.log(`[Sync Engine] Successfully fetched snapshot (${res.rows[0].value.length} bytes) from Render PostgreSQL.`);
        await renderPool.end();
        return {
          db: new DatabaseSync(tempPath),
          path: tempPath,
          isTemp: true
        };
      }
      await renderPool.end();
    } catch (err) {
      await renderPool.end();
      throw new Error(`Failed to fetch database snapshot from Render PostgreSQL: ${err.message}`);
    }
  }

  throw new Error('No primary database found! Neither local SQLite file nor Render DATABASE_URL snapshot is available.');
}

/**
 * Connect to Supabase PostgreSQL target
 */
export function getSupabasePool() {
  const supaUrl = process.env.SUPABASE_DATABASE_URL || process.env.BACKUP_DATABASE_URL;
  if (!supaUrl) {
    throw new Error('SUPABASE_DATABASE_URL environment variable is missing. Set it to your Supabase PostgreSQL connection string.');
  }

  return new Pool({
    connectionString: supaUrl,
    ssl: supaUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    max: 10
  });
}

/**
 * Ensures backup_audit_logs exists in the SQLite primary database
 */
function ensureSqliteAuditTable(db) {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS backup_audit_logs (
        id TEXT PRIMARY KEY,
        trigger_type TEXT NOT NULL,
        status TEXT NOT NULL,
        tables_synced INTEGER DEFAULT 0,
        total_records INTEGER DEFAULT 0,
        discrepancies TEXT DEFAULT '[]',
        duration_ms INTEGER DEFAULT 0,
        details TEXT DEFAULT '',
        created_at INTEGER NOT NULL
      );
    `);
  } catch {}
}

/**
 * Core Synchronization and Parity Check Engine
 */
export async function runBackupSync(options = {}) {
  const {
    triggerType = 'cron',
    verifyOnly = false,
    dryRun = false,
    targetTable = null,
    silent = false
  } = options;

  const startTime = Date.now();
  const log = (...args) => { if (!silent) console.log(...args); };

  log('================================================================================');
  log(`[Backup Engine] 🚀 Starting ${verifyOnly ? 'Parity Verification' : 'Backup & Sync'} (${new Date().toISOString()})`);
  log(`[Backup Engine] Trigger: ${triggerType} | DryRun: ${dryRun} | VerifyOnly: ${verifyOnly}`);
  log('================================================================================');

  let sqliteInfo = null;
  let supaPool = null;

  try {
    // 1. Initialize Connections
    sqliteInfo = await getPrimarySqliteDb();
    const db = sqliteInfo.db;
    ensureSqliteAuditTable(db);
    log(`[Backup Engine] ✅ Connected to Render primary database: ${sqliteInfo.path}`);

    supaPool = getSupabasePool();
    const testRes = await supaPool.query('SELECT NOW() as now, current_database() as db_name');
    log(`[Backup Engine] ✅ Connected to Supabase target: ${testRes.rows[0].db_name} (Time: ${testRes.rows[0].now})`);

    // 2. Initialize Target Schemas
    if (!verifyOnly && !dryRun) {
      log('[Backup Engine] Ensuring Supabase table schemas and indexes exist...');
      await supaPool.query(TABLE_SCHEMAS_SQL);
      log('[Backup Engine] ✅ Supabase schema synchronized.');
    }

    // 3. Replicate Binary Snapshot to sard_cloud_store on Supabase
    if (!verifyOnly && !dryRun && (!targetTable || targetTable === 'sard_cloud_store')) {
      try {
        db.exec('PRAGMA wal_checkpoint(PASSIVE);');
        if (fs.existsSync(sqliteInfo.path)) {
          const snapshotBuffer = fs.readFileSync(sqliteInfo.path);
          const nowTs = Date.now();
          await supaPool.query(`
            INSERT INTO public.sard_cloud_store (key, value, updated_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
          `, ['sard_main_db', snapshotBuffer, nowTs]);
          log(`[Backup Engine] ✅ Binary snapshot successfully saved to Supabase (Size: ${(snapshotBuffer.length / 1024).toFixed(1)} KB)`);
        }
      } catch (snapErr) {
        log(`[Backup Engine] ⚠️ Binary snapshot warning: ${snapErr.message}`);
      }
    }

    // Determine tables to process
    const tablesToProcess = targetTable
      ? SYNC_TABLES.filter(t => t.toLowerCase() === targetTable.toLowerCase())
      : SYNC_TABLES;

    let totalSyncedRecords = 0;
    let tablesSyncedCount = 0;

    // 4. Batch Sync Data (Render -> Supabase)
    if (!verifyOnly) {
      log('\n[Backup Engine] Synchronizing relational tables in dependency order...');

      const supaClient = await supaPool.connect();
      try {
        // Set replica mode to bypass foreign-key constraints during high-speed upsert
        await supaClient.query("SET session_replication_role = 'replica';");

        for (const tableName of tablesToProcess) {
          // Check if table exists in SQLite
          const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
          if (!tableCheck) {
            log(`  - Table "${tableName}" does not exist in source. Skipping.`);
            continue;
          }

          // Dynamically ensure Supabase table has all columns present in source
          if (!dryRun) {
            await syncTableColumns(supaClient, db, tableName);
          }

          // Inspect columns and primary key
          const pragmaCols = db.prepare(`PRAGMA table_info("${tableName}")`).all();
          const colNames = pragmaCols.map(c => c.name);
          const pkCols = pragmaCols.filter(c => c.pk > 0).map(c => c.name);

          if (colNames.length === 0) continue;

          // Fetch all rows from SQLite
          const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();
          if (rows.length === 0) {
            log(`  - Table "${tableName}": 0 rows (empty)`);
            tablesSyncedCount++;
            continue;
          }

          if (dryRun) {
            log(`  - [DryRun] Table "${tableName}": ${rows.length} rows ready for sync.`);
            tablesSyncedCount++;
            totalSyncedRecords += rows.length;
            continue;
          }

          // Batch insert/upsert into Supabase (200 rows per batch)
          const BATCH_SIZE = 200;
          const nonPkCols = colNames.filter(c => !pkCols.includes(c));

          for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const chunk = rows.slice(i, i + BATCH_SIZE);
            const valueClauses = [];
            const flatValues = [];
            let paramIdx = 1;

            for (const row of chunk) {
              const rowPlaceholders = [];
              for (const col of colNames) {
                rowPlaceholders.push(`$${paramIdx++}`);
                let val = row[col];
                // Convert booleans/numbers/nulls cleanly
                if (val === undefined) val = null;
                flatValues.push(val);
              }
              valueClauses.push(`(${rowPlaceholders.join(', ')})`);
            }

            const quotedCols = colNames.map(c => `"${c}"`).join(', ');
            let query = `INSERT INTO public."${tableName}" (${quotedCols}) VALUES ${valueClauses.join(', ')}`;

            if (pkCols.length > 0) {
              const quotedPks = pkCols.map(c => `"${c}"`).join(', ');
              if (nonPkCols.length > 0) {
                const updateClauses = nonPkCols.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');
                query += ` ON CONFLICT (${quotedPks}) DO UPDATE SET ${updateClauses}`;
              } else {
                query += ` ON CONFLICT (${quotedPks}) DO NOTHING`;
              }
            } else {
              // No explicit primary key
              query += ` ON CONFLICT DO NOTHING`;
            }

            await supaClient.query(query, flatValues);
          }

          tablesSyncedCount++;
          totalSyncedRecords += rows.length;
          log(`  - Table "${tableName}": synced ${rows.length} rows ✅`);
        }
      } finally {
        await supaClient.query("SET session_replication_role = 'origin';");
        supaClient.release();
      }
    }

    // 5. Automated Data Parity Verification
    log('\n[Backup Engine] 🔍 Executing Automated Parity Verification...');
    const parityResults = [];
    const discrepancies = [];

    for (const tableName of tablesToProcess) {
      // Check SQLite table
      const sqliteTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
      if (!sqliteTable) continue;

      // Count & Max Timestamp in SQLite
      const pragmaCols = db.prepare(`PRAGMA table_info("${tableName}")`).all();
      const colNames = pragmaCols.map(c => c.name);

      let tsCol = null;
      if (colNames.includes('created_at')) tsCol = 'created_at';
      else if (colNames.includes('updated_at')) tsCol = 'updated_at';
      else if (colNames.includes('joined_at')) tsCol = 'joined_at';

      const sqliteCountRow = db.prepare(`SELECT COUNT(*) AS cnt FROM "${tableName}"`).get();
      const sqliteCount = Number(sqliteCountRow?.cnt || 0);

      let sqliteMaxTs = null;
      if (tsCol) {
        const tsRow = db.prepare(`SELECT MAX("${tsCol}") AS max_ts FROM "${tableName}"`).get();
        sqliteMaxTs = tsRow?.max_ts != null ? Number(tsRow.max_ts) : null;
      }

      // Count & Max Timestamp in Supabase
      let supaCount = 0;
      let supaMaxTs = null;

      try {
        const countRes = await supaPool.query(`SELECT COUNT(*) AS cnt FROM public."${tableName}"`);
        supaCount = Number(countRes.rows[0]?.cnt || 0);

        if (tsCol) {
          const maxRes = await supaPool.query(`SELECT MAX("${tsCol}") AS max_ts FROM public."${tableName}"`);
          supaMaxTs = maxRes.rows[0]?.max_ts != null ? Number(maxRes.rows[0].max_ts) : null;
        }
      } catch (supaErr) {
        supaCount = -1; // table might not exist
      }

      const isCountMatch = sqliteCount === supaCount;
      const isTsMatch = sqliteMaxTs === supaMaxTs;
      const isOk = isCountMatch && (dryRun ? true : isTsMatch);

      const status = isOk ? 'MATCH' : 'MISMATCH';
      if (!isOk) {
        discrepancies.push({
          table: tableName,
          renderCount: sqliteCount,
          supaCount,
          renderMaxTs: sqliteMaxTs,
          supaMaxTs,
          diff: supaCount - sqliteCount
        });
      }

      parityResults.push({
        table: tableName,
        renderCount: sqliteCount,
        supaCount,
        renderMaxTs: sqliteMaxTs,
        supaMaxTs,
        status,
        tsCol
      });
    }

    // 6. Print Parity Table
    if (!silent) {
      console.log('\n' + '┌' + '─'.repeat(24) + '┬' + '─'.repeat(14) + '┬' + '─'.repeat(14) + '┬' + '─'.repeat(12) + '┬' + '─'.repeat(24) + '┐');
      console.log('│ ' + 'Table'.padEnd(22) + ' │ ' + 'Render Rows'.padEnd(12) + ' │ ' + 'Supabase Rows'.padEnd(12) + ' │ ' + 'Status'.padEnd(10) + ' │ ' + 'Latest Timestamp'.padEnd(22) + ' │');
      console.log('├' + '─'.repeat(24) + '┼' + '─'.repeat(14) + '┼' + '─'.repeat(14) + '┼' + '─'.repeat(12) + '┼' + '─'.repeat(24) + '┤');

      for (const r of parityResults) {
        const statusBadge = r.status === 'MATCH' ? '✅ MATCH' : '❌ MISMATCH';
        const tsFormatted = r.renderMaxTs ? new Date(r.renderMaxTs).toISOString().replace('T', ' ').slice(0, 19) : '—';
        console.log(
          '│ ' + r.table.padEnd(22) +
          ' │ ' + String(r.renderCount).padStart(12) +
          ' │ ' + (r.supaCount >= 0 ? String(r.supaCount).padStart(12) : 'ERR'.padStart(12)) +
          ' │ ' + statusBadge.padEnd(10) +
          ' │ ' + tsFormatted.padEnd(22) + ' │'
        );
      }
      console.log('└' + '─'.repeat(24) + '┴' + '─'.repeat(14) + '┴' + '─'.repeat(14) + '┴' + '─'.repeat(12) + '┴' + '─'.repeat(24) + '┘');
    }

    const durationMs = Date.now() - startTime;
    const finalStatus = discrepancies.length === 0 ? 'success' : (dryRun ? 'dry_run' : 'warning');
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const details = `Synced ${tablesSyncedCount} tables, ${totalSyncedRecords} rows. ${discrepancies.length} discrepancies.`;

    // 7. Persist to backup_audit_logs on Supabase
    if (!dryRun) {
      try {
        await supaPool.query(`
          INSERT INTO public.backup_audit_logs (id, trigger_type, status, tables_synced, total_records, discrepancies, duration_ms, details, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [auditId, triggerType, finalStatus, tablesSyncedCount, totalSyncedRecords, JSON.stringify(discrepancies), durationMs, details, Date.now()]);
        log('[Backup Engine] ✅ Parity audit log saved to Supabase.');
      } catch (logErr) {
        log(`[Backup Engine] ⚠️ Could not save audit log to Supabase: ${logErr.message}`);
      }
    }

    // 8. Persist to local SQLite audit log
    try {
      db.prepare(`
        INSERT INTO backup_audit_logs (id, trigger_type, status, tables_synced, total_records, discrepancies, duration_ms, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(auditId, triggerType, finalStatus, tablesSyncedCount, totalSyncedRecords, JSON.stringify(discrepancies), durationMs, details, Date.now());
    } catch {}

    log('\n================================================================================');
    log(`[Backup Engine] ✨ Complete in ${durationMs}ms! Overall Status: ${finalStatus.toUpperCase()}`);
    log(`[Backup Engine] Total Records: ${totalSyncedRecords} | Tables Checked: ${parityResults.length} | Discrepancies: ${discrepancies.length}`);
    log('================================================================================\n');

    return {
      success: discrepancies.length === 0,
      status: finalStatus,
      durationMs,
      tablesSynced: tablesSyncedCount,
      totalRecords: totalSyncedRecords,
      discrepancies,
      parityResults,
      auditId
    };

  } finally {
    if (sqliteInfo?.isTemp && fs.existsSync(sqliteInfo.path)) {
      try { fs.unlinkSync(sqliteInfo.path); } catch {}
    }
    if (supaPool) {
      await supaPool.end().catch(() => {});
    }
  }
}

// ── CLI Direct Invocation Support ───────────────────────────────────────────
if (process.argv[1] && process.argv[1].endsWith('sync-and-verify-backup.mjs')) {
  const args = process.argv.slice(2);
  const verifyOnly = args.includes('--verify-only') || args.includes('-v');
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const silent = args.includes('--silent') || args.includes('--json');
  
  let targetTable = null;
  const tableIdx = args.indexOf('--table');
  if (tableIdx !== -1 && args[tableIdx + 1]) {
    targetTable = args[tableIdx + 1];
  }

  runBackupSync({
    triggerType: 'cli',
    verifyOnly,
    dryRun,
    targetTable,
    silent
  }).then(result => {
    if (args.includes('--json')) {
      console.log(JSON.stringify(result, null, 2));
    }
    process.exit(result.success ? 0 : 1);
  }).catch(err => {
    console.error('\n[Backup Engine Error]:', err.message);
    process.exit(1);
  });
}
