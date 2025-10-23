// backend/middleware/rateLimitMiddleware.js
/**
 * Rate Limiting Middleware
 * Giới hạn số lượng request từ một IP trong một khoảng thời gian
 */

const rateLimit = new Map();

/**
 * Simple in-memory rate limiter
 * Trong production nên dùng Redis để lưu trữ
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 1 * 60 * 1000, // 15 phút
    max = 100, // Tối đa 100 requests
    message = 'Too many requests, please try again later',
    statusCode = 429,
  } = options;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Lấy thông tin rate limit của IP này
    let record = rateLimit.get(ip);

    // Nếu chưa có hoặc đã hết window time
    if (!record || now - record.resetTime > windowMs) {
      record = {
        count: 0,
        resetTime: now,
      };
      rateLimit.set(ip, record);
    }

    // Tăng counter
    record.count++;

    // Kiểm tra có vượt quá limit không
    if (record.count > max) {
      return res.status(statusCode).json({
        success: false,
        message,
        retryAfter: Math.ceil((windowMs - (now - record.resetTime)) / 1000),
      });
    }

    // Set headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime + windowMs).toISOString());

    next();
  };
};

// Cleanup old entries every 1 hour
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  for (const [ip, record] of rateLimit.entries()) {
    if (now - record.resetTime > oneHour) {
      rateLimit.delete(ip);
    }
  }
}, 60 * 60 * 1000);

// Các rate limiters với cấu hình khác nhau
const authRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 5, // Tối đa 5 login attempts
  message: 'Too many login attempts, please try again after 1 minute',
});

const refreshTokenRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 20, // Tối đa 20 refresh requests
  message: 'Too many refresh token requests, please try again later',
});

const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Tối đa 100 requests
  message: 'Too many requests, please try again later',
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
  refreshTokenRateLimiter,
  generalRateLimiter,
};
