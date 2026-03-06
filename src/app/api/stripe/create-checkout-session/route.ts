import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { requireAuth } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    if (!STRIPE_CONFIG.proPriceId) {
      return NextResponse.json(
        { error: 'Pro plan is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json(
        { error: 'App URL is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const user = await requireAuth();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: STRIPE_CONFIG.proPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/canceled`,
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe Checkout] Error creating checkout session:', error instanceof Error ? error.message : error);

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
