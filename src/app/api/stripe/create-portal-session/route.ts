import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { requireAuth, getUserSubscription } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const subscription = await getUserSubscription(user.id);

    if (!subscription.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Create Stripe billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/interview/select`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
