// backend/middleware/activityLogMiddleware.js
/**
 * User Activity Logging Middleware - SV1
 * Ghi lại hoạt động người dùng với logActivity(userId, action, timestamp)
 * Chống brute force login và tracking user behaviors
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./loggingMiddleware');

// Tạo thư mục activity-logs nếu chưa có
const activityLogsDir = path.join(__dirname, '../logs/activity');
if (!fs.existsSync(activityLogsDir)) {
  fs.mkdirSync(activityLogsDir, { recursive: true });
}

/**
 * In-memory store để tracking login attempts (production nên dùng Redis)
 */
const loginAttempts = new Map();
const userActivities = new Map();

/**
 * Core function: logActivity(userId, action, timestamp)
 * Ghi log hoạt động người dùng theo format yêu cầu SV1
 */
const logActivity = (userId, action, timestamp = new Date(), metadata = {}) => {
  const activityEntry = {
    userId: userId || 'anonymous',
    action,
    timestamp: timestamp.toISOString(),
    ip: metadata.ip || 'unknown',
    userAgent: metadata.userAgent || 'unknown',
    statusCode: metadata.statusCode || null,
    details: metadata.details || {},
    sessionId: metadata.sessionId || null
  };

  // Ghi vào file activity log
  const dateStr = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
  const activityLogFile = path.join(activityLogsDir, `activity-${dateStr}.log`);
  const logLine = JSON.stringify(activityEntry) + '\n';
  fs.appendFileSync(activityLogFile, logLine);

  // Log ra console trong development
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [ACTIVITY] User ${userId} - ${action} at ${timestamp.toISOString()}`);
  }

  // Store in memory cho reporting (optional)
  if (!userActivities.has(userId)) {
    userActivities.set(userId, []);
  }
  userActivities.get(userId).push(activityEntry);

  // Keep only last 50 activities per user in memory
  if (userActivities.get(userId).length > 50) {
    userActivities.get(userId).shift();
  }

  return activityEntry;
};

/**
 * Middleware để auto-log activities
 */
const activityLogger = (action) => {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    res.json = function(body) {
      // Log activity when response is sent
      const userId = req.user?.id || req.user?._id || 'anonymous';
      const timestamp = new Date();
      
      logActivity(userId, action, timestamp, {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        statusCode: res.statusCode,
        details: {
          method: req.method,
          url: req.originalUrl,
          body: req.method === 'POST' ? req.body : undefined,
          success: res.statusCode < 400
        },
        sessionId: req.sessionID || req.headers['x-session-id']
      });

      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Enhanced Rate Limiter cho login với brute force protection
 */
const loginRateLimiter = (options = {}) => {
  const {
    windowMs = 1 * 60 * 1000, // 1 phút
    maxAttempts = 5,
    blockDuration = 15 * 60 * 1000, // 15 phút block
    progressiveDelay = true
  } = options;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const email = req.body?.email || 'unknown';
    const key = `${ip}:${email}`;
    const now = Date.now();

    // Get current attempt record
    let attempts = loginAttempts.get(key);

    // Reset if window expired
    if (!attempts || now - attempts.firstAttempt > windowMs) {
      attempts = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false,
        blockUntil: null
      };
      loginAttempts.set(key, attempts);
    }

    // Check if currently blocked
    if (attempts.blocked && attempts.blockUntil && now < attempts.blockUntil) {
      const remainingTime = Math.ceil((attempts.blockUntil - now) / 1000);
      
      // Log blocked attempt
      logActivity(email, 'LOGIN_BLOCKED', new Date(), {
        ip,
        userAgent: req.get('user-agent'),
        details: {
          reason: 'Too many failed login attempts',
          remainingBlockTime: remainingTime,
          attemptCount: attempts.count
        }
      });

      return res.status(429).json({
        success: false,
        message: `Account temporarily blocked. Try again in ${remainingTime} seconds.`,
        retryAfter: remainingTime,
        blockReason: 'BRUTE_FORCE_PROTECTION'
      });
    }

    // Increment attempt counter
    attempts.count++;
    attempts.lastAttempt = now;

    // Check if exceeded max attempts
    if (attempts.count > maxAttempts) {
      attempts.blocked = true;
      attempts.blockUntil = now + blockDuration;

      // Log brute force detection
      logActivity(email, 'BRUTE_FORCE_DETECTED', new Date(), {
        ip,
        userAgent: req.get('user-agent'),
        details: {
          attemptCount: attempts.count,
          blockDuration: blockDuration / 1000,
          windowMs: windowMs / 1000
        }
      });

      logger.warn(`🚨 Brute force detected for ${email} from ${ip}`, {
        attemptCount: attempts.count,
        blockDuration: blockDuration / 1000
      });

      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Account blocked for ${blockDuration / 60000} minutes.`,
        retryAfter: blockDuration / 1000,
        blockReason: 'BRUTE_FORCE_PROTECTION'
      });
    }

    // Log login attempt
    logActivity(email, 'LOGIN_ATTEMPT', new Date(), {
      ip,
      userAgent: req.get('user-agent'),
      details: {
        attemptNumber: attempts.count,
        remainingAttempts: maxAttempts - attempts.count
      }
    });

    // Add cleanup on successful login (to be called from auth controller)
    req.clearLoginAttempts = () => {
      loginAttempts.delete(key);
      logActivity(email, 'LOGIN_SUCCESS', new Date(), {
        ip,
        userAgent: req.get('user-agent'),
        details: {
          attemptsCleared: true,
          totalAttempts: attempts.count
        }
      });
    };

    next();
  };
};

/**
 * Middleware để log failed login attempts
 */
const logFailedLogin = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(body) {
    if (res.statusCode === 401 && req.body?.email) {
      logActivity(req.body.email, 'LOGIN_FAILED', new Date(), {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        details: {
          reason: body.message || 'Authentication failed',
          email: req.body.email
        }
      });
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};

/**
 * Get user activities (for admin or debugging)
 */
const getUserActivities = (userId, limit = 20) => {
  const activities = userActivities.get(userId) || [];
  return activities.slice(-limit).reverse(); // Latest first
};

/**
 * Clean up old data (should be called periodically)
 */
const cleanup = () => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  // Clean login attempts
  for (const [key, attempts] of loginAttempts.entries()) {
    if (now - attempts.lastAttempt > oneHour) {
      loginAttempts.delete(key);
    }
  }

  // Clean user activities (keep recent ones)
  for (const [userId, activities] of userActivities.entries()) {
    if (activities.length > 100) {
      userActivities.set(userId, activities.slice(-50));
    }
  }
};

// Cleanup every hour
setInterval(cleanup, 60 * 60 * 1000);

module.exports = {
  logActivity,           // Core function: logActivity(userId, action, timestamp)
  activityLogger,        // Auto-logging middleware
  loginRateLimiter,      // Enhanced rate limiter for login
  logFailedLogin,        // Log failed login attempts
  getUserActivities,     // Get user activities
  cleanup                // Manual cleanup function
};