import mongoose from 'mongoose';

const { Schema } = mongoose;

/* How many live orders one shopper holds against one coupon.

   One document per (coupon, shopper). The unique index is what enforces the
   per-user limit under concurrency: the redeeming update only matches while
   `count` is below the limit, and when it does not match, the upsert's insert
   collides with the existing row instead of creating a second one. */
const couponRedemptionSchema = new Schema(
  {
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
    code: { type: String, required: true },
    userKey: { type: String, required: true },
    count: { type: Number, min: 0, default: 0 }
  },
  { timestamps: true }
);

couponRedemptionSchema.index({ couponId: 1, userKey: 1 }, { unique: true });

const CouponRedemption = mongoose.models.CouponRedemption || mongoose.model('CouponRedemption', couponRedemptionSchema);

export default CouponRedemption;
export { CouponRedemption };
