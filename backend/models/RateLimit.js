// backend/models/RateLimit.js
const mongoose = require('mongoose');

const rateLimitSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['ip', 'user', 'email'],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastAttempt: {
      type: Date,
      default: Date.now,
    },
    blockedUntil: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Single indexes
rateLimitSchema.index({ identifier: 1 }, { unique: true });
rateLimitSchema.index({ type: 1 });

// TTL index - auto delete entries older than 1 day
rateLimitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

// Compound index for type + blocked status
rateLimitSchema.index({ type: 1, blockedUntil: 1 });

// Virtual: Check if currently blocked
rateLimitSchema.virtual('isBlocked').get(function () {
  if (!this.blockedUntil) return false;
  return this.blockedUntil > Date.now();
});

// Virtual: Time remaining on block (in seconds)
rateLimitSchema.virtual('blockTimeRemaining').get(function () {
  if (!this.isBlocked) return 0;
  return Math.ceil((this.blockedUntil - Date.now()) / 1000);
});

// Static method: Record attempt
rateLimitSchema.statics.recordAttempt = async function (identifier, type = 'ip') {
  let record = await this.findOne({ identifier });

  if (!record) {
    record = new this({
      identifier,
      type,
      attempts: 1,
      lastAttempt: Date.now(),
    });
  } else {
    // Reset if last attempt was more than 15 minutes ago
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    if (record.lastAttempt < fifteenMinutesAgo) {
      record.attempts = 1;
      record.blockedUntil = null;
    } else {
      record.attempts += 1;
    }
    record.lastAttempt = Date.now();
  }

  await record.save();
  return record;
};

// Static method: Check if blocked
rateLimitSchema.statics.isBlocked = async function (identifier) {
  const record = await this.findOne({ identifier });

  if (!record) return false;
  if (!record.blockedUntil) return false;
  
  return record.blockedUntil > Date.now();
};

// Static method: Block identifier
rateLimitSchema.statics.blockIdentifier = async function (
  identifier,
  type = 'ip',
  duration = 15 * 60 * 1000, // 15 minutes
  reason = 'Too many failed attempts'
) {
  const blockedUntil = new Date(Date.now() + duration);

  await this.findOneAndUpdate(
    { identifier },
    {
      identifier,
      type,
      blockedUntil,
      reason,
      lastAttempt: Date.now(),
    },
    { upsert: true, new: true }
  );

  return blockedUntil;
};

// Static method: Unblock identifier
rateLimitSchema.statics.unblockIdentifier = async function (identifier) {
  await this.findOneAndUpdate(
    { identifier },
    {
      blockedUntil: null,
      attempts: 0,
      reason: null,
    }
  );
};

// Static method: Get all blocked identifiers
rateLimitSchema.statics.getBlocked = function () {
  return this.find({
    blockedUntil: { $gt: Date.now() },
  }).sort({ blockedUntil: -1 });
};

// Static method: Clean expired blocks
rateLimitSchema.statics.cleanExpiredBlocks = async function () {
  const result = await this.updateMany(
    {
      blockedUntil: { $lte: Date.now(), $ne: null },
    },
    {
      blockedUntil: null,
      attempts: 0,
    }
  );

  return result.modifiedCount;
};

const RateLimit = mongoose.model('RateLimit', rateLimitSchema);

module.exports = RateLimit;
