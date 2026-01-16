import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { requireAuth } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 [Stripe Checkout] Starting checkout session creation...');

    // Check environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY is missing');
      return NextResponse.json(
        { error: 'Stripe is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    if (!STRIPE_CONFIG.proPriceId) {
      console.error('❌ STRIPE_PRO_PRICE_ID is missing');
      return NextResponse.json(
        { error: 'Pro plan is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('❌ NEXT_PUBLIC_APP_URL is missing');
      return NextResponse.json(
        { error: 'App URL is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    console.log('🔵 [Stripe Checkout] Environment variables verified');
    console.log('🔵 [Stripe Checkout] Pro Price ID:', STRIPE_CONFIG.proPriceId);
    console.log('🔵 [Stripe Checkout] App URL:', process.env.NEXT_PUBLIC_APP_URL);

    const user = await requireAuth();
    console.log('🔵 [Stripe Checkout] User authenticated:', user.id, user.email);

    // Create Stripe checkout session
    console.log('🔵 [Stripe Checkout] Creating Stripe session...');
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
        trial_period_days: STRIPE_CONFIG.trialPeriodDays,
        metadata: {
          user_id: user.id,
        },
      },
    });

    console.log('✅ [Stripe Checkout] Session created successfully:', session.id);
    console.log('🔵 [Stripe Checkout] Checkout URL:', session.url);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('❌ [Stripe Checkout] Error creating checkout session:', error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error('❌ [Stripe Checkout] Error message:', error.message);
      console.error('❌ [Stripe Checkout] Error stack:', error.stack);
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
