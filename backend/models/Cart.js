import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const GUEST_CART_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const cartItemSchema = new Schema(
  {
    itemId: { type: String, required: true },
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    size: { type: String, default: 'default' },
    color: { type: String, default: 'Default' },
    image: { type: String, default: '' }
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    guestId: {
      type: String,
      default: null
    },
    items: {
      type: [cartItemSchema],
      default: []
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

cartSchema.pre('validate', function requireOneOwner(next) {
  if (!this.userId && !this.guestId) {
    return next(new Error('Cart must belong to either a userId or a guestId'));
  }
  if (this.userId && this.guestId) {
    return next(new Error('Cart cannot have both a userId and a guestId'));
  }
  next();
});

cartSchema.pre('save', function syncExpiry(next) {
  this.expiresAt = this.guestId
    ? new Date(Date.now() + GUEST_CART_TTL_SECONDS * 1000)
    : null;
  next();
});

cartSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: 'objectId' } } });
cartSchema.index({ guestId: 1 }, { unique: true, partialFilterExpression: { guestId: { $type: 'string' } } });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Cart = mongoose.models.Cart || model('Cart', cartSchema);

export default Cart;
export { Cart };
