// backend/models/ActivityLog.js
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'logout',
        'signup',
        'forgot_password',
        'reset_password',
        'update_profile',
        'upload_avatar',
        'refresh_token',
        'failed_login',
        'account_locked',
        'password_changed',
        'email_changed',
        'view_profile',
        'admin_action',
        'other',
      ],
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'error'],
      default: 'success',
    },
    errorMessage: {
      type: String,
      default: null,
    },
    duration: {
      type: Number, // milliseconds
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Single indexes
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ ipAddress: 1 });
activityLogSchema.index({ timestamp: 1 });

// Compound indexes for common queries
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ userId: 1, action: 1, timestamp: -1 });
activityLogSchema.index({ ipAddress: 1, timestamp: -1 });
activityLogSchema.index({ status: 1, timestamp: -1 });

// TTL index - auto delete logs older than 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Virtual property: check if recent (within last hour)
activityLogSchema.virtual('isRecent').get(function () {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return this.timestamp >= oneHourAgo;
});

// Static method: Get logs by user
activityLogSchema.statics.getByUser = function (userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'name email');
};

// Static method: Get logs by action
activityLogSchema.statics.getByAction = function (action, limit = 100) {
  return this.find({ action })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'name email');
};

// Static method: Get failed logins by IP
activityLogSchema.statics.getFailedLoginsByIP = function (ipAddress, since = null) {
  const query = {
    action: 'failed_login',
    ipAddress,
  };

  if (since) {
    query.timestamp = { $gte: since };
  }

  return this.find(query).sort({ timestamp: -1 });
};

// Static method: Get login attempts count (for rate limiting)
activityLogSchema.statics.countLoginAttempts = async function (identifier, timeWindow = 15 * 60 * 1000) {
  const since = new Date(Date.now() - timeWindow);
  
  // identifier can be userId, email, or ipAddress
  const query = {
    action: { $in: ['login', 'failed_login'] },
    timestamp: { $gte: since },
  };

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.userId = identifier;
  } else if (identifier.includes('@')) {
    // Email - need to lookup user
    const User = mongoose.model('User');
    const user = await User.findOne({ email: identifier.toLowerCase() });
    if (user) query.userId = user._id;
  } else {
    // IP address
    query.ipAddress = identifier;
  }

  return this.countDocuments(query);
};

// Static method: Get activity stats
activityLogSchema.statics.getStats = async function (timeRange = 'day') {
  const now = new Date();
  let since;

  switch (timeRange) {
    case 'hour':
      since = new Date(now - 60 * 60 * 1000);
      break;
    case 'day':
      since = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      since = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      since = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      since = new Date(now - 24 * 60 * 60 * 1000);
  }

  const stats = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: since },
      },
    },
    {
      $group: {
        _id: {
          action: '$action',
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return stats;
};

// Static method: Check if IP is suspicious
activityLogSchema.statics.isSuspiciousIP = async function (ipAddress, threshold = 10) {
  const recentFailures = await this.getFailedLoginsByIP(
    ipAddress,
    new Date(Date.now() - 60 * 60 * 1000) // Last hour
  );

  return recentFailures.length >= threshold;
};

// Instance method: Format for display
activityLogSchema.methods.toDisplay = function () {
  return {
    id: this._id,
    user: this.userId ? (this.userId.name || this.userId.email) : 'Unknown',
    action: this.action,
    status: this.status,
    ipAddress: this.ipAddress,
    timestamp: this.timestamp,
    details: this.details,
  };
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
