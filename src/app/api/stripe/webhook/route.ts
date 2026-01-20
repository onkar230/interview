import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import {
  updateUserSubscription,
  logSubscriptionEvent,
  getUserByStripeCustomerId,
  getServiceSupabase,
} from '@/lib/supabase';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log(`Processing webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, event.id);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, event.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, event.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice, event.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice, event.id);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Trial ending soon for subscription: ${subscription.id}`);
        // Optional: Send email notification to user
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  eventId: string
) {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in checkout session metadata');
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Fetch full subscription details from Stripe to avoid race conditions
  let subscriptionTier: 'free' | 'pro' = 'free';
  let subscriptionStatus = 'active';
  let currentPeriodStart: string | null = null;
  let currentPeriodEnd: string | null = null;
  let trialEndsAt: string | null = null;

  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
      subscriptionStatus = subscription.status;
      subscriptionTier = (subscription.status === 'active' || subscription.status === 'trialing') ? 'pro' : 'free';
      currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
      currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      if (subscription.trial_end) {
        trialEndsAt = new Date(subscription.trial_end * 1000).toISOString();
      }
    } catch (err) {
      console.error('Failed to fetch subscription details:', err);
    }
  }

  // Update user with ALL subscription data in single atomic operation
  // This eliminates race conditions with subsequent webhook events
  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('user_profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_tier: subscriptionTier,
      subscription_status: subscriptionStatus,
      subscription_current_period_start: currentPeriodStart,
      subscription_current_period_end: currentPeriodEnd,
      trial_ends_at: trialEndsAt,
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update user subscription:', error);
    throw error;
  }

  // Log event
  await logSubscriptionEvent(userId, {
    stripeEventId: eventId,
    eventType: 'checkout.session.completed',
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    data: session,
  });

  console.log(`Checkout completed for user ${userId}, customer ${customerId}, tier=${subscriptionTier}, status=${subscriptionStatus}`);
}

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  eventId: string
) {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const user = await getUserByStripeCustomerId(customerId);
  if (!user) {
    console.error(`No user found for Stripe customer: ${customerId}`);
    return;
  }

  const status = subscription.status;
  const tier: 'free' | 'pro' =
    status === 'active' || status === 'trialing' ? 'pro' : 'free';

  await updateUserSubscription(user.id, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    tier,
    status,
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    trialEndsAt: (subscription as any).trial_end
      ? new Date((subscription as any).trial_end * 1000)
      : null,
  });

  await logSubscriptionEvent(user.id, {
    stripeEventId: eventId,
    eventType: 'subscription.updated',
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    data: subscription,
  });

  console.log(
    `Subscription updated for user ${user.id}: tier=${tier}, status=${status}`
  );
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  eventId: string
) {
  const customerId = subscription.customer as string;

  const user = await getUserByStripeCustomerId(customerId);
  if (!user) {
    console.error(`No user found for Stripe customer: ${customerId}`);
    return;
  }

  // Downgrade to free tier
  await updateUserSubscription(user.id, {
    tier: 'free',
    status: 'canceled',
    currentPeriodStart: undefined,
    currentPeriodEnd: undefined,
    trialEndsAt: null,
  });

  await logSubscriptionEvent(user.id, {
    stripeEventId: eventId,
    eventType: 'subscription.deleted',
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    data: subscription,
  });

  console.log(`Subscription canceled for user ${user.id}, downgraded to free`);
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  eventId: string
) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as any).subscription as string;

  const user = await getUserByStripeCustomerId(customerId);
  if (!user) {
    console.error(`No user found for Stripe customer: ${customerId}`);
    return;
  }

  // Ensure user is on Pro tier
  await updateUserSubscription(user.id, {
    tier: 'pro',
    status: 'active',
  });

  await logSubscriptionEvent(user.id, {
    stripeEventId: eventId,
    eventType: 'payment.succeeded',
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    data: invoice,
  });

  console.log(`Payment succeeded for user ${user.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice, eventId: string) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as any).subscription as string;

  const user = await getUserByStripeCustomerId(customerId);
  if (!user) {
    console.error(`No user found for Stripe customer: ${customerId}`);
    return;
  }

  // Update status to past_due (keep Pro tier during grace period)
  await updateUserSubscription(user.id, {
    tier: 'pro',
    status: 'past_due',
  });

  await logSubscriptionEvent(user.id, {
    stripeEventId: eventId,
    eventType: 'payment.failed',
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    data: invoice,
  });

  console.log(`Payment failed for user ${user.id}, status set to past_due`);
}
