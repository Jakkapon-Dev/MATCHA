import mongoose from 'mongoose';

const { Schema } = mongoose;

export const COUPON_TYPES = ['percentage', 'fixed_amount', 'free_shipping'];
export const COUPON_CODE_PATTERN = /^[A-Z0-9_-]{3,30}$/;

/* A promotional code the administrator manages.

   The server is the only thing that decides what a coupon is worth: checkout
   sends the code, never an amount. Orders keep a snapshot of the coupon as it
   was when they were placed (Order.coupon), so editing or disabling a coupon
   here never rewrites what an old order was charged.

   Coupons are disabled rather than deleted once they exist, for the same
   reason: the history has to keep making sense.

   `usedCount` only ever moves through an atomic conditional update inside
   the order transaction (services/coupons.js), never read-modify-write. */
const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      match: COUPON_CODE_PATTERN
    },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    type: { type: String, required: true, enum: COUPON_TYPES },
    value: { type: Number, min: 0, default: 0 },
    minOrderAmount: { type: Number, min: 0, default: 0 },
    maxDiscountAmount: { type: Number, min: 0, default: null },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, min: 1, default: null },
    usedCount: { type: Number, min: 0, default: 0 },
    perUserLimit: { type: Number, min: 1, default: null },
    active: { type: Boolean, default: true },
    applicableProducts: { type: [String], default: [] },
    applicableCategories: { type: [String], default: [] },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null }
  },
  { timestamps: true }
);

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

export default Coupon;
export { Coupon };
