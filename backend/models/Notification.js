import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    default: 'new_order',
    enum: ['new_order']
  },
  /* The idempotency key for a new-order notification.

     Held as a string rather than an ObjectId on purpose. The same key has to
     survive a round trip through the JSON disk outbox, where an ObjectId comes
     back as its hex string — declared as an ObjectId, the flushed copy would
     no longer equal the original and the unique index below would let a second
     notification through for an order that already has one. Callers go through
     notificationKey() so every writer produces the same canonical string. */
  orderId: {
    type: String,
    required: true,
    trim: true
  },
  orderNumber: {
    type: String,
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

/* One order, one new-order notification. This is the guarantee itself, not an
   optimisation: retries, the outbox worker and the reconciliation sweep all
   race to write the same record, and the database is the only place that can
   settle it. Every writer treats E11000 here as success. */
notificationSchema.index({ orderId: 1, type: 1 }, { unique: true });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
