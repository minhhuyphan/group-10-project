const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true }, // store a hashed token
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expires: { type: Date, required: true },
    createdByIp: { type: String, default: null },
    revoked: { type: Date, default: null },
    revokedByIp: { type: String, default: null },
    replacedByToken: { type: String, default: null },
  },
  { timestamps: true }
);

// Virtuals / helpers
refreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= this.expires;
});

refreshTokenSchema.virtual('isActive').get(function () {
  return !this.revoked && Date.now() < this.expires;
});

// Static helper to create a new refresh token for a user
refreshTokenSchema.statics.createToken = function (userId, expiresInSeconds = 7 * 24 * 60 * 60) {
  const token = crypto.randomBytes(40).toString('hex');
  const expires = new Date(Date.now() + expiresInSeconds * 1000);
  // store hashed token
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const doc = new this({ token: hashed, user: userId, expires });
  return { doc, token };
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
