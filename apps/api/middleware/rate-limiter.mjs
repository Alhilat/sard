/**
 * High-performance, zero-dependency in-memory rate limiter
 * Protects against brute-force attacks, credential stuffing, and DoS.
 */
export function createRateLimiter({
  windowMs = 60 * 1000,
  max = 60,
  message = 'تم تجاوز الحد المسموح للطلبات، يرجى المحاولة بعد قليل',
} = {}) {
  const store = new Map();

  // Automatic cleanup every minute to prevent memory growth
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, Math.max(30000, windowMs));

  // Allow the node process to exit cleanly if needed
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return function rateLimiter(req, res, next) {
    // Determine client identifier: IP address or forwarded IP
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    let entry = store.get(clientIp);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(clientIp, entry);
    } else {
      entry.count += 1;
    }

    const remaining = Math.max(0, max - entry.count);
    const retryAfterSec = Math.ceil((entry.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > max) {
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSec,
      });
    }

    next();
  };
}

/** Stricter rate limit for sensitive authentication endpoints (20 req / min) */
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'تم تجاوز عدد محاولات تسجيل الدخول المسموح بها، يرجى الانتظار لدقيقة واحدة',
});

/** General protection for all API endpoints (300 req / min) */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً',
});
