import Stripe from 'stripe';

// Test-mode key by default so the app still boots (card checkout just errors clearly)
// when a contributor hasn't set up their own Stripe account yet.
const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY is not set — card payments will fail until it is configured in backend/.env');
}

export const stripe = secretKey ? new Stripe(secretKey) : null;

export default stripe;
