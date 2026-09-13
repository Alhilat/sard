import { Router } from 'express';
import { metrics } from '../services/cache.mjs';
import { getPersistenceStatus } from '../db/persistence.mjs';
import { SUPABASE_DATABASE_URL } from '../config/env.mjs';

const router = Router();

router.get(['/health', '/ping'], (_req, res) => {
  const persistence = getPersistenceStatus();

  res.json({
    status: 'ok',
    mode: process.env.NODE_ENV || 'production',
    engine: 'SQLite 3 (WAL)',
    cloud_persistence: persistence.isActive ? 'active' : 'local_only',
    database_provider: persistence.provider,
    auto_recovery_from_supabase: Boolean(SUPABASE_DATABASE_URL),
    total_requests: metrics.totalRequests,
    uptime_sec: Math.floor((Date.now() - metrics.startedAt) / 1000),
    timestamp: new Date().toISOString(),
  });
});

export default router;
