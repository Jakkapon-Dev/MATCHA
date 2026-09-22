import mongoose from 'mongoose';

/* A notification that could not be written when its order was taken.

   The row exists so a failed notification is a delayed one rather than a lost
   one. Nothing here ever touches an Order: the worker replays this queue into
   the Notification collection only, so a retry can never produce a second
   order. */
const outboxSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      default: 'new_order'
    },
    // The canonical notificationKey() string, matching Notification.orderId.
    orderId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    /* Error text only, never anything off the payload. The queue holds a
       customer's name and order total; the failure log must not. */
    lastError: {
      type: String,
      default: ''
    },
    nextRetryAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    processedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// The worker's claim query: the pending rows whose backoff has elapsed.
outboxSchema.index({ status: 1, nextRetryAt: 1 });
outboxSchema.index({ orderId: 1, type: 1 });

const NotificationOutbox = mongoose.models.NotificationOutbox || mongoose.model('NotificationOutbox', outboxSchema);
export default NotificationOutbox;
