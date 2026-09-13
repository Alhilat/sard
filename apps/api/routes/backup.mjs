import { Router } from 'express';
import { SUPABASE_DATABASE_URL } from '../config/env.mjs';
import { getStatements } from '../db/statements/index.mjs';
import { getPersistenceStatus } from '../db/persistence.mjs';
import { getSchedulerStatus } from '../../../scripts/backup-scheduler.mjs';
import { runBackupSync } from '../../../scripts/sync-and-verify-backup.mjs';
import { restoreFromSupabase } from '../../../scripts/restore-from-supabase.mjs';

const router = Router();

// GET /api/backup/status
router.get('/backup/status', (_req, res) => {
  try {
    const scheduler = getSchedulerStatus();
    let latestLogs = [];
    try {
      const { stmtGetLatestBackupAudit } = getStatements();
      latestLogs = stmtGetLatestBackupAudit.all().map(item => ({
        ...item,
        discrepancies: typeof item.discrepancies === 'string' ? JSON.parse(item.discrepancies || '[]') : item.discrepancies
      }));
    } catch {}

    const persistence = getPersistenceStatus();

    res.json({
      success: true,
      active: scheduler.enabled,
      scheduler,
      latest_audit: latestLogs[0] || null,
      history: latestLogs,
      auto_recovery_enabled: Boolean(SUPABASE_DATABASE_URL),
      auto_recovery_source: SUPABASE_DATABASE_URL ? 'Supabase PostgreSQL (Automatic)' : 'Disabled (Set SUPABASE_DATABASE_URL)',
      target: SUPABASE_DATABASE_URL ? 'Supabase PostgreSQL (Configured)' : 'Standby (SUPABASE_DATABASE_URL not set)',
      persistence_target: persistence.provider,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'تعذر جلب حالة النسخ الاحتياطي', error: err.message });
  }
});

// POST /api/petra/backup/trigger
router.post('/petra/backup/trigger', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const backupKey = req.headers['x-backup-key'] || req.query.key;

  const isPetraAdmin = token && token.startsWith('petra_session_');
  const isKeyAuthorized = Boolean(backupKey && process.env.BACKUP_SECRET_KEY && backupKey === process.env.BACKUP_SECRET_KEY);

  if (!isPetraAdmin && !isKeyAuthorized) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح لك ببدء عملية النسخ الاحتياطي اليدوي (Admin Token or Backup Key required)'
    });
  }

  try {
    const result = await runBackupSync({ triggerType: 'manual_api' });
    res.json({
      success: result.success,
      status: result.status,
      message: result.success ? 'اكتمل النسخ الاحتياطي وفحص البيانات بنجاح' : 'اكتمل النسخ مع وجود تباينات',
      result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `فشلت عملية النسخ الاحتياطي: ${err.message}`
    });
  }
});

// POST /api/petra/backup/restore
router.post('/petra/backup/restore', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const backupKey = req.headers['x-backup-key'] || req.query.key;

  const isPetraAdmin = token && token.startsWith('petra_session_');
  const isKeyAuthorized = Boolean(backupKey && process.env.BACKUP_SECRET_KEY && backupKey === process.env.BACKUP_SECRET_KEY);

  if (!isPetraAdmin && !isKeyAuthorized) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح لك باسترجاع النسخة الاحتياطية (Admin Token or Backup Key required)'
    });
  }

  try {
    const result = await restoreFromSupabase({
      force: true,
      silent: false,
      isAutoRecovery: true,
      supaUrl: SUPABASE_DATABASE_URL
    });

    res.json({
      success: true,
      message: `تم استرجاع قاعدة البيانات من Supabase بنجاح (${result.recordsCount} سجل)`,
      result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `فشلت عملية الاسترجاع: ${err.message}`
    });
  }
});

export default router;
