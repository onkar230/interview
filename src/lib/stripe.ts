import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

export const STRIPE_CONFIG = {
  proPriceId: process.env.STRIPE_PRO_PRICE_ID || '',
  freeTierLimit: parseInt(process.env.FREE_TIER_MONTHLY_LIMIT || '10', 10),
  trialPeriodDays: 7,
};
