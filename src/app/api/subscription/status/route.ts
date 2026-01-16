import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSubscription, canUserStartInterview } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const subscription = await getUserSubscription(user.id);
    const accessCheck = await canUserStartInterview(user.id);

    return NextResponse.json({
      tier: subscription.subscription_tier,
      status: subscription.subscription_status,
      interviewsUsed: subscription.interviews_used_this_month || 0,
      interviewLimit: accessCheck.limit || null,
      canStartInterview: accessCheck.allowed,
      trialEndsAt: subscription.trial_ends_at,
      currentPeriodEnd: subscription.subscription_current_period_end,
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
