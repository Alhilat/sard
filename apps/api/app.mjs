import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { metricsMiddleware } from './middleware/metrics.mjs';
import { autoSyncMiddleware } from './middleware/auto-sync.mjs';
import { errorHandler } from './middleware/error-handler.mjs';
import apiRouter from './routes/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(db) {
  const app = express();

  if (db) {
    app.locals.db = db;
  }

  // Core Middlewares
  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(metricsMiddleware);
  app.use(autoSyncMiddleware);

  // Mount API Router
  app.use('/api', apiRouter);

  // Static Frontend Serving (Render & Production Support)
  const candidatePaths = [
    path.resolve(__dirname, '../web/dist/public'),
    path.resolve(process.cwd(), 'apps/web/dist/public'),
    path.resolve(__dirname, '../sard-raqami/dist/public')
  ];
  const frontendDist = candidatePaths.find(p => fs.existsSync(p)) || candidatePaths[0];
  if (fs.existsSync(frontendDist)) {
    console.log(`[Frontend] Serving production bundle from: ${frontendDist}`);
    app.use(express.static(frontendDist));
  }

  // Unmatched routes handler: JSON 404 for /api, index.html for SPA
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ success: false, message: 'المسار البرمجي المطلوب غير موجود' });
    }
    if (fs.existsSync(frontendDist)) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;
