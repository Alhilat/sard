import { recordMetric } from '../services/cache.mjs';

/**
 * Response time recording middleware for sub-millisecond benchmarking
 */
export function metricsMiddleware(req, res, next) {
  const start = performance.now();
  res.on('finish', () => {
    const duration = performance.now() - start;
    recordMetric(duration);
  });
  next();
}
