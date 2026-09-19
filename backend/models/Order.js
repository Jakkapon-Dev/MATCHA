import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const customerSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, default: '' },
    color: { type: String, default: 'Default' },
    image: { type: String, default: '' },
    priceAtPurchase: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },
    orderId: {
      type: String,
      sparse: true
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true
    },
    /* Accounts live in the JSON user store, not in Mongo, so their ids look
       like `u_3f1c…` rather than a 24-character ObjectId — the same mismatch
       that detached every cart from its owner. Declared as an ObjectId, this
       field silently took null for every real customer: all 13 orders in the
       database were written with userId: null and reachable only by matching
       the email on the order. */
    userId: {
      type: String,
      default: null
    },
    /* Who placed this when nobody was signed in.

       It holds the same `guest-<32 hex>` value the cart uses, taken from the
       X-Guest-Id header the browser already sends on every request. Without it
       an order placed by a guest belonged to no one that could be asked about
       later, so the only way to show a guest their own order was to show
       everybody every order — which is exactly what the list endpoint used to
       do.

       It is a bearer value, not an identity: whoever holds the id sees those
       orders. That is the same trust the cart already places in it, and it is
       generated with crypto.randomUUID, so it is not guessable. It is scoped
       to one browser, so clearing site data loses the history with it. */
    guestId: {
      type: String,
      default: null
    },
    customer: {
      type: customerSchema,
      required: true
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Order must contain at least one item'
      }
    },
    couponCode: {
      type: String,
      default: null
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['visa', 'mastercard', 'cod', 'qr', 'demo']
    },
    shippingOption: {
      type: String,
      required: true,
      enum: ['standard', 'express', 'premium']
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid'
    }
  },
  { timestamps: true }
);

orderSchema.pre('validate', function assignOrderNumber(next) {
  if (!this.orderNumber) {
    const year = new Date().getFullYear();
    const stamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    this.orderNumber = `MTA-${year}-${stamp}-${random}`;
  }
  if (!this.orderId) {
    this.orderId = this.orderNumber;
  }
  if (typeof next === 'function') next();
});

orderSchema.pre('validate', function recomputeTotal(next) {
  this.total = Math.max(0, this.subtotal + this.shippingCost - this.discount);
  if (typeof next === 'function') next();
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ guestId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

const Order = mongoose.models.Order || model('Order', orderSchema);

export default Order;
export { Order };
