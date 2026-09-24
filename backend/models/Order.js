import mongoose from 'mongoose';

import { PAYMENT_STATES } from '../config/paymentStates.js';

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
    /* Account ids look like `u_3f1c…` rather than a 24-character ObjectId,
       kept as they were when accounts moved into Mongo — the same mismatch that
       detached every cart from its owner. Declared as an ObjectId, this field
       silently took null for every real customer: all 13 orders in the database
       were written with userId: null and reachable only by matching the email
       on the order. */
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
    /* Where this order stands with the money. The lifecycle and what each
       state means are in config/paymentStates.js.

       It used to be three values, and a checkout that failed stayed `unpaid`
       forever — indistinguishable from a cash-on-delivery order that had
       simply not been delivered yet. Nothing could tell the two apart, so
       nothing could safely reclaim the stock from either. */
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATES,
      default: 'unpaid'
    },
    stripePaymentIntentId: {
      type: String,
      default: null
    },
    paymentAmount: {
      type: Number,
      default: null,
      min: 0
    },
    paymentCurrency: {
      type: String,
      default: null,
      lowercase: true,
      trim: true
    },
    paymentError: {
      type: String,
      default: null
    },

    /* When this order stops being payable and its stock goes back on sale.
     *
     * Placing an order takes the stock off the shelf before Stripe is ever
     * asked for money. That is the right order of operations — the only way
     * two shoppers cannot both buy the last M — but it means a declined card,
     * a closed tab or an abandoned PromptPay QR left an order holding goods
     * with nothing that would ever give them back.
     *
     * Only orders with an online payment step get a deadline. Cash on
     * delivery has nothing to wait for, so it is left null and the reconciler
     * never looks at it. It is cleared the moment payment is confirmed.
     */
    paymentExpiresAt: {
      type: Date,
      default: null
    },

    /* Stamped when this order's stock went back, by whichever of the
       reconciler, a webhook or an explicit cancellation got there first.

       It is the idempotency marker for the release: every path that returns
       stock requires it to be null and sets it in the same conditional
       update, so a duplicate webhook, a retried job and a customer pressing
       cancel twice cannot credit the same units twice over.
     */
    stockReleasedAt: {
      type: Date,
      default: null
    },

    /* Which language to write to this customer in.
       Taken from the site at the moment of checkout rather than guessed later
       from the address or the country, both of which are wrong often enough to
       matter. Thai is the default because the shop is. */
    locale: {
      type: String,
      enum: ['th', 'en'],
      default: 'th'
    },
    isAnonymized: {
      type: Boolean,
      default: false
    },
    anonymizedAt: {
      type: Date,
      default: null
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
// The reconciler's query: still owed, still holding stock, past its deadline.
orderSchema.index({ paymentExpiresAt: 1, paymentStatus: 1, stockReleasedAt: 1 });
orderSchema.index({ stripePaymentIntentId: 1 }, { unique: true, sparse: true });

const Order = mongoose.models.Order || model('Order', orderSchema);

export default Order;
export { Order };
