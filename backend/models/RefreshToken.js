import mongoose from 'mongoose';
import crypto from 'node:crypto';

const { Schema, model } = mongoose;

const REMEMBER_ME_TTL_DAYS = 30;
const SHORT_SESSION_TTL_HOURS = 12;

const refreshTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true
    },
    rememberMe: {
      type: Boolean,
      default: true
    },
    userAgent: {
      type: String,
      default: ''
    },
    ip: {
      type: String,
      default: ''
    },
    expiresAt: {
      type: Date,
      required: true
    },
    revokedAt: {
      type: Date,
      default: null
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

refreshTokenSchema.statics.hashToken = function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

refreshTokenSchema.pre('validate', function applyDefaultExpiry(next) {
  if (!this.expiresAt) {
    const ttlMs = this.rememberMe
      ? REMEMBER_ME_TTL_DAYS * 24 * 60 * 60 * 1000
      : SHORT_SESSION_TTL_HOURS * 60 * 60 * 1000;
    this.expiresAt = new Date(Date.now() + ttlMs);
  }
  next();
});

refreshTokenSchema.virtual('isActive').get(function isActive() {
  return !this.revokedAt && this.expiresAt > new Date();
});

refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.models.RefreshToken || model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
export { RefreshToken };
