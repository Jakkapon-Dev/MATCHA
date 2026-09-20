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
    /* Account ids look like `u_3f1c…` rather than a 24-character ObjectId:
       they were minted by the JSON user store this project used to run on, and
       they were carried over unchanged when accounts moved into Mongo so that
       existing orders, carts and tokens kept working. Declaring this field as
       an ObjectId meant no signed-in visitor could ever own a cart: the route's
       ObjectId check rejected every real id, fell through to the guest branch
       without complaint, and the cart followed the browser instead of the
       account. */
    userId: {
      type: String,
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

// mongoose เวอร์ชันนี้ไม่ได้ส่ง next เข้ามาให้ hook เสมอไป เรียกตรง ๆ จะพังด้วย
// "next is not a function" — โยน error ออกไปแทนการเรียก next(err) จึงปลอดภัยกว่า
// (รูปแบบเดียวกับที่ models/Order.js ใช้อยู่)
cartSchema.pre('validate', function requireOneOwner(next) {
  if (!this.userId && !this.guestId) {
    throw new Error('Cart must belong to either a userId or a guestId');
  }
  if (this.userId && this.guestId) {
    throw new Error('Cart cannot have both a userId and a guestId');
  }
  if (typeof next === 'function') next();
});

cartSchema.pre('save', function syncExpiry(next) {
  this.expiresAt = this.guestId
    ? new Date(Date.now() + GUEST_CART_TTL_SECONDS * 1000)
    : null;
  if (typeof next === 'function') next();
});

/* A partial index cannot change its filter in place, and the old one selected
   on $type: 'objectId' — which matched nothing, because nothing was ever
   written. The replacement is given its own name so both can exist while the
   stale index is dropped: db.carts.dropIndex('userId_1'). */
cartSchema.index(
  { userId: 1 },
  { unique: true, name: 'userId_unique', partialFilterExpression: { userId: { $type: 'string' } } },
);
cartSchema.index({ guestId: 1 }, { unique: true, partialFilterExpression: { guestId: { $type: 'string' } } });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Cart = mongoose.models.Cart || model('Cart', cartSchema);

export default Cart;
export { Cart };
