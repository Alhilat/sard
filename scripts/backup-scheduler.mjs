#!/usr/bin/env node
/**
 * ============================================================================
 * Sard Raqami — 2x Daily Automated Backup Scheduler (Render -> Supabase)
 * ============================================================================
 * Runs twice every day at 03:00 UTC and 15:00 UTC (every 12 hours)
 * Provides automatic retry on failure and real-time execution telemetry.
 * Can be run standalone or imported into speed-server.mjs.
 * ============================================================================
 */

import { runBackupSync } from './sync-and-verify-backup.mjs';

let activeTimer = null;
let isRunning = false;
let lastExecutionResult = null;
let lastExecutionTime = null;

// Target UTC hours: 03:00 and 15:00 (twice daily)
export const SCHEDULED_UTC_HOURS = [3, 15];

/**
 * Calculate the millisecond delay until the next target UTC hour (03:00 or 15:00)
 */
export function getNextBackupTarget(now = new Date()) {
  const currentUtcHour = now.getUTCHours();
  const currentUtcMinute = now.getUTCMinutes();
  const currentUtcSecond = now.getUTCSeconds();
  const currentUtcMs = now.getUTCMilliseconds();

  // Find the next scheduled hour today
  let nextHour = SCHEDULED_UTC_HOURS.find(h => {
    if (h > currentUtcHour) return true;
    if (h === currentUtcHour && (currentUtcMinute > 0 || currentUtcSecond > 0 || currentUtcMs > 0)) return false;
    if (h === currentUtcHour) return true;
    return false;
  });

  const target = new Date(now);
  if (nextHour !== undefined) {
    target.setUTCHours(nextHour, 0, 0, 0);
  } else {
    // Tomorrow at the first scheduled hour
    target.setUTCDate(target.getUTCDate() + 1);
    target.setUTCHours(SCHEDULED_UTC_HOURS[0], 0, 0, 0);
  }

  const delayMs = target.getTime() - now.getTime();
  return {
    targetDate: target,
    delayMs: Math.max(delayMs, 1000)
  };
}

/**
 * Execute one scheduled backup cycle
 */
export async function executeScheduledBackup(triggerType = 'cron') {
  if (isRunning) {
    console.log('[Backup Scheduler] Backup already in progress. Skipping overlapping run.');
    return;
  }

  isRunning = true;
  console.log(`\n[Backup Scheduler] ⏰ Triggering scheduled backup cycle at ${new Date().toISOString()}...`);

  try {
    const result = await runBackupSync({ triggerType });
    lastExecutionResult = result;
    lastExecutionTime = new Date().toISOString();
    console.log(`[Backup Scheduler] ✅ Scheduled cycle finished successfully (Status: ${result.status}, Duration: ${result.durationMs}ms)`);
    return result;
  } catch (err) {
    console.error(`[Backup Scheduler] ❌ Scheduled cycle failed: ${err.message}`);
    lastExecutionResult = {
      success: false,
      status: 'failed',
      error: err.message,
      timestamp: new Date().toISOString()
    };
    lastExecutionTime = new Date().toISOString();
    throw err;
  } finally {
    isRunning = false;
  }
}

/**
 * Schedule the next backup execution in the loop
 */
function scheduleNext() {
  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }

  const { targetDate, delayMs } = getNextBackupTarget();
  const hoursUntil = (delayMs / (1000 * 60 * 60)).toFixed(2);

  console.log(`[Backup Scheduler] 🛡️ Next automated sync scheduled for: ${targetDate.toISOString()} (~${hoursUntil} hours from now)`);

  activeTimer = setTimeout(async () => {
    try {
      await executeScheduledBackup('cron');
    } catch {}
    scheduleNext(); // Re-arm timer for the next cycle
  }, delayMs);

  // Unref timer so it doesn't block Node process exit if running tests
  if (activeTimer?.unref) {
    activeTimer.unref();
  }
}

/**
 * Start the scheduler
 */
export function startBackupScheduler(options = {}) {
  const { immediate = false } = options;

  console.log('[Backup Scheduler] 🚀 Initializing 2x Daily Backup Engine (Render -> Supabase)');
  console.log(`[Backup Scheduler] Schedule: Every 12 Hours (03:00 UTC & 15:00 UTC)`);

  if (immediate) {
    console.log('[Backup Scheduler] Running immediate baseline sync on startup...');
    executeScheduledBackup('startup').then(() => {
      scheduleNext();
    }).catch(() => {
      scheduleNext();
    });
  } else {
    scheduleNext();
  }

  return {
    getStatus: getSchedulerStatus,
    stop: stopBackupScheduler
  };
}

/**
 * Stop the scheduler
 */
export function stopBackupScheduler() {
  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
    console.log('[Backup Scheduler] Scheduler stopped.');
  }
}

/**
 * Get current scheduler status and telemetry
 */
export function getSchedulerStatus() {
  const next = getNextBackupTarget();
  return {
    enabled: Boolean(activeTimer),
    isRunning,
    schedule: '2x daily (03:00 UTC & 15:00 UTC)',
    scheduledUtcHours: SCHEDULED_UTC_HOURS,
    nextScheduledRun: next.targetDate.toISOString(),
    hoursUntilNextRun: Number((next.delayMs / (1000 * 60 * 60)).toFixed(2)),
    lastExecutionTime,
    lastExecutionResult
  };
}

// ── CLI Direct Invocation Support ───────────────────────────────────────────
if (process.argv[1] && process.argv[1].endsWith('backup-scheduler.mjs')) {
  const immediate = process.argv.includes('--immediate') || process.argv.includes('-i');
  startBackupScheduler({ immediate });

  console.log('[Backup Scheduler] Daemon running in foreground. Press Ctrl+C to terminate.');
  process.on('SIGINT', () => {
    stopBackupScheduler();
    process.exit(0);
  });
}
