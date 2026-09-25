import mongoose from 'mongoose';

export const DEFAULT_DB_UNAVAILABLE_MESSAGE = 'ฐานข้อมูลยังไม่พร้อม กรุณาลองใหม่';

/**
 * Express middleware to ensure MongoDB is connected (readyState === 1).
 *
 * Can be used directly as route middleware:
 *   router.use(requireDbReady);
 *
 * Or as a factory with customized response options:
 *   const databaseRequired = requireDbReady({ message: 'Database unavailable' });
 */
export function requireDbReady(optionsOrReq, res, next) {
  // Direct middleware usage: requireDbReady(req, res, next)
  if (res && typeof next === 'function') {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: DEFAULT_DB_UNAVAILABLE_MESSAGE });
    }
    return next();
  }

  // Factory usage: requireDbReady(options)
  const options = typeof optionsOrReq === 'string' ? { message: optionsOrReq } : (optionsOrReq || {});
  const message = options.message || DEFAULT_DB_UNAVAILABLE_MESSAGE;
  const status = options.status || 503;

  return function dbReadyGuard(req, res, next) {
    if (mongoose.connection.readyState !== 1) {
      return res.status(status).json({ success: false, message });
    }
    next();
  };
}

export default requireDbReady;
