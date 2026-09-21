import { loadStripe } from '@stripe/stripe-js';

// Loaded once and shared across the app. Passing an empty key to loadStripe
// produces a rejected promise, so an unconfigured local checkout receives
// null and can show its normal "payment is not ready" message instead.
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
