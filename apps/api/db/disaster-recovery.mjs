import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { SUPABASE_DATABASE_URL } from '../config/env.mjs';
import { restoreFromSupabase } from '../../../scripts/restore-from-supabase.mjs';
import { promoteSupabasePersistence } from './persistence.mjs';

/**
 * Checks local database health and automatically restores from Supabase if data is missing/empty.
 */
export async function checkAndAutoRecover(dbPath, { primaryHasSnapshot, isCloudPersistenceActive }) {
  let localHasData = false;
  let localUserCount = 0;

  if (fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0) {
    try {
      const probeDb = new DatabaseSync(dbPath);
      const tbls = probeDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").all();
      if (tbls.length > 0) {
        localUserCount = Number(probeDb.prepare("SELECT COUNT(*) as c FROM users").get()?.c || 0);
        if (localUserCount > 0) {
          localHasData = true;
        }
      }
      probeDb.close();
    } catch (probeErr) {
      console.log('[Database Probe] Note on local file:', probeErr.message);
    }
  }

  // Automatic Disaster Recovery from Supabase
  if (SUPABASE_DATABASE_URL && (!primaryHasSnapshot || !localHasData)) {
    console.log(`[Auto-Disaster Recovery] 🛡️ Verifying data integrity (Local users: ${localUserCount}, Primary snapshot: ${primaryHasSnapshot})...`);
    console.log('[Auto-Disaster Recovery] 🔄 Automatically checking Supabase for latest backup snapshot or records...');
    try {
      const autoRestoreRes = await restoreFromSupabase({
        force: true,
        silent: false,
        isAutoRecovery: true,
        supaUrl: SUPABASE_DATABASE_URL
      });

      if (autoRestoreRes && autoRestoreRes.success) {
        console.log(`[Auto-Disaster Recovery] ✅ SUCCESS: Automatically restored ${autoRestoreRes.recordsCount} records across ${autoRestoreRes.tablesCount} tables from Supabase!`);
        localHasData = true;
      }
    } catch (autoErr) {
      console.error('[Auto-Disaster Recovery] Note on automatic Supabase restoration:', autoErr.message);
    }
  }

  // Auto-Persistence Failover to Supabase
  if (!isCloudPersistenceActive && SUPABASE_DATABASE_URL) {
    await promoteSupabasePersistence(SUPABASE_DATABASE_URL);
  }

  return {
    localHasData,
    localUserCount
  };
}
