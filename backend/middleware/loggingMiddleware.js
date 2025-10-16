// backend/middleware/loggingMiddleware.js
/**
 * Logging Middleware
 * Ghi log các request, response và errors
 */

const fs = require('fs');
const path = require('path');

// Tạo thư mục logs nếu chưa có
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Format date cho tên file
const getLogFileName = () => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${dateStr}.log`;
};

// Ghi log vào file
const writeLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  // Ghi vào file log theo ngày
  const logFile = path.join(logsDir, getLogFileName());
  fs.appendFileSync(logFile, logLine);

  // Cũng in ra console trong development mode
  if (process.env.NODE_ENV === 'development') {
    const colors = {
      INFO: '\x1b[36m',    // Cyan
      WARN: '\x1b[33m',    // Yellow
      ERROR: '\x1b[31m',   // Red
      SUCCESS: '\x1b[32m', // Green
    };
    const resetColor = '\x1b[0m';
    const color = colors[level] || '';
    console.log(`${color}[${level}]${resetColor} ${timestamp} - ${message}`);
    if (Object.keys(meta).length > 0) {
      console.log(JSON.stringify(meta, null, 2));
    }
  }
};

/**
 * Request Logger Middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  // Log khi response kết thúc
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    const level = statusCode >= 400 ? 'ERROR' : statusCode >= 300 ? 'WARN' : 'INFO';

    writeLog(level, `${method} ${originalUrl}`, {
      method,
      url: originalUrl,
      statusCode,
      duration: `${duration}ms`,
      ip: ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};

/**
 * Error Logger Middleware
 */
const errorLogger = (err, req, res, next) => {
  writeLog('ERROR', err.message || 'Unknown error', {
    method: req.method,
    url: req.originalUrl,
    stack: err.stack,
    body: req.body,
    ip: req.ip || req.connection.remoteAddress,
  });

  next(err);
};

/**
 * Logger functions để dùng ở các controller
 */
const logger = {
  info: (message, meta) => writeLog('INFO', message, meta),
  warn: (message, meta) => writeLog('WARN', message, meta),
  error: (message, meta) => writeLog('ERROR', message, meta),
  success: (message, meta) => writeLog('SUCCESS', message, meta),
};

module.exports = {
  requestLogger,
  errorLogger,
  logger,
};
