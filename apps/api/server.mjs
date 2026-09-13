import { PORT, HOST, SUPABASE_DATABASE_URL } from './config/env.mjs';
import { initDatabase, closeDatabase } from './db/index.mjs';
import { initStatements } from './db/statements/index.mjs';
import { loadBannedUsers } from './services/cache.mjs';
import { createApp } from './app.mjs';
import { initWebSocketServer, closeWebSocketServer } from './services/websocket.mjs';
import { startBackupScheduler } from '../../scripts/backup-scheduler.mjs';

async function bootstrap() {
  try {
    // 1. Initialize SQLite engine & Cloud PostgreSQL persistence
    const db = await initDatabase();

    // 2. Prepare all cached SQL statements
    initStatements(db);

    // 3. Populate in-memory lookup cache
    loadBannedUsers(db);

    // 4. Create Express app with all middlewares & routes
    const app = createApp(db);

    // 5. Start background backup scheduler if configured
    let backupStatusText = 'STANDBY (Set SUPABASE_DATABASE_URL to enable 2x daily backup)';
    if (SUPABASE_DATABASE_URL) {
      try {
        startBackupScheduler({ immediate: false });
        backupStatusText = 'ACTIVE (2x Daily: 03:00 UTC & 15:00 UTC)';
      } catch (schedErr) {
        backupStatusText = `ERROR: ${schedErr.message}`;
      }
    }

    // 6. Listen on specified PORT and HOST
    const server = app.listen(PORT, HOST, () => {
      console.log(`
  ══════════════════════════════════════════════════════════════════════════
  🚀 SARD RAQAMI BACKEND SERVER (منصة سرد رقمي)
  ══════════════════════════════════════════════════════════════════════════
  📡 HTTP Server Listening : http://${HOST}:${PORT}
  ⚡ Real-Time WebSocket   : ws://${HOST}:${PORT}/ws
  💾 Database Storage     : SQLite 3 (WAL Mode)
  🛡️ Petra Admin Gate      : /api/petra/*
  ☁️ Supabase Cloud Sync   : ${backupStatusText}
  ══════════════════════════════════════════════════════════════════════════
      `);
    });

    // 7. Initialize Real-Time WebSocket Engine on the same server
    initWebSocketServer(server);

    // 8. Graceful shutdown handler
    const handleShutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Gracefully flushing data & shutting down...`);
      try {
        closeWebSocketServer();
      } catch (e) {}

      const forceExit = setTimeout(async () => {
        try { await closeDatabase(); } catch (e) {}
        process.exit(0);
      }, 1000);
      if (forceExit.unref) forceExit.unref();

      server.close(async () => {
        clearTimeout(forceExit);
        await closeDatabase();
        console.log('[Server] Shutdown complete. Data safely preserved.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

  } catch (err) {
    console.error('[Server Bootstrap Failed]:', err);
    process.exit(1);
  }
}

bootstrap();
