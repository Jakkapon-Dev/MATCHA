const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');
const Order = require('./Order');
const Cart = require('./Cart');
const orderSchema = Order.schema.clone();
orderSchema.add({ 
  isDemo: { type: Boolean, default: true }, 
  requestFingerprint: String,
  orderId: { type: String, default: () => `DEMO-${randomUUID()}` }
});
if (orderSchema.path('orderNumber')) {
  orderSchema.path('orderNumber').default(() => `DEMO-${randomUUID()}`);
}
module.exports = {
  DemoOrder: mongoose.models.DemoOrder || mongoose.model('DemoOrder', orderSchema, 'demo_orders'),
  DemoCart: mongoose.models.DemoCart || mongoose.model('DemoCart', Cart.schema.clone(), 'demo_carts')
};
