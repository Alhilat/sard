/**
 * Central Error Handler Middleware
 */
export function errorHandler(err, req, res, next) {
  console.error(`[API Error] ${req.method} ${req.url}:`, err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'حدث خطأ غير متوقع في الخادم',
    error: process.env.NODE_ENV !== 'production' ? err.message : undefined
  });
}
