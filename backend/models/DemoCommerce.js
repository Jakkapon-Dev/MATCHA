import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import Order from './Order.js';
import Cart from './Cart.js';

const orderSchema = Order.schema.clone();
orderSchema.add({ 
  isDemo: { type: Boolean, default: true }, 
  requestFingerprint: String,
  orderId: { type: String, default: () => `DEMO-${randomUUID()}` }
});
if (orderSchema.path('orderNumber')) {
  orderSchema.path('orderNumber').default(() => `DEMO-${randomUUID()}`);
}

export const DemoOrder = mongoose.models.DemoOrder || mongoose.model('DemoOrder', orderSchema, 'demo_orders');
export const DemoCart = mongoose.models.DemoCart || mongoose.model('DemoCart', Cart.schema.clone(), 'demo_carts');

export default { DemoOrder, DemoCart };
