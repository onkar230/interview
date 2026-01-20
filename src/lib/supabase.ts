/**
 * Supabase Client Configuration with Auth & Database Helpers
 */

import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// ============================================
// CLIENT-SIDE SUPABASE (Browser/Client Components)
// ============================================
export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};

// ============================================
// SERVER-SIDE SUPABASE (Server Components/Actions/API Routes)
// ============================================
export const getServerSupabase = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle error in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle error
          }
        },
      },
    }
  );
};

// ============================================
// SERVICE ROLE CLIENT (Admin Operations - Use Sparingly!)
// ============================================
export const getServiceSupabase = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// ============================================
// AUTH HELPER FUNCTIONS
// ============================================

/**
 * Get current authenticated user (server-side)
 */
export async function getUser() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Require authentication (throws if not logged in)
 */
export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// ============================================
// DATABASE HELPER FUNCTIONS
// ============================================

/**
 * Create a new interview session
 */
export async function createInterviewSession(
  userId: string,
  config: {
    industry: string;
    role: string;
    company: string;
    difficulty: string;
    jobDescription?: string;
    questionTypes?: string[];
    customQuestions?: string[];
    followUpIntensity?: string;
    maxQuestions?: number;
    cvText?: string;
    questionPriority?: string[];
    companyResearch?: string;
    usePersonalization?: boolean;
    personalizationRelevance?: number;
  }
) {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from('interview_sessions')
    .insert({
      user_id: userId,
      industry: config.industry,
      role: config.role,
      company: config.company,
      difficulty: config.difficulty,
      job_description: config.jobDescription,
      question_types: config.questionTypes,
      custom_questions: config.customQuestions,
      follow_up_intensity: config.followUpIntensity || 'moderate',
      max_questions: config.maxQuestions || 10,
      cv_text: config.cvText,
      question_priority: config.questionPriority,
      company_research: config.companyResearch,
      use_personalization: config.usePersonalization || false,
      personalization_relevance: config.personalizationRelevance || 0,
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Save an interview message
 */
export async function saveInterviewMessage(
  sessionId: string,
  message: {
    role: 'user' | 'assistant';
    content: string;
    audioUrl?: string;
  }
) {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from('interview_messages')
    .insert({
      session_id: sessionId,
      role: message.role,
      content: message.content,
      audio_url: message.audioUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get interview session with messages and feedback items
 */
export async function getInterviewSession(sessionId: string) {
  const supabase = await getServerSupabase();

  const { data: session, error: sessionError } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError) throw sessionError;

  const { data: messages, error: messagesError } = await supabase
    .from('interview_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;

  // Also fetch feedback items for resuming sessions
  const { data: feedbackItems, error: feedbackError } = await supabase
    .from('interview_feedback_items')
    .select('*')
    .eq('session_id', sessionId)
    .order('question_number', { ascending: true });

  if (feedbackError) throw feedbackError;

  return { session, messages, feedbackItems };
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: 'pending' | 'active' | 'completed' | 'abandoned',
  endedAt?: string
) {
  const supabase = await getServerSupabase();

  const updateData: any = { status };
  if (endedAt) updateData.ended_at = endedAt;

  const { data, error } = await supabase
    .from('interview_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Save interview evaluation
 */
export async function saveEvaluation(
  sessionId: string,
  evaluation: {
    verdict: 'pass' | 'borderline' | 'fail';
    overallScore?: number;
    communicationScore?: number;
    technicalScore?: number;
    problemSolvingScore?: number;
    relevantExperienceScore?: number;
    strengths: string[];
    weaknesses: string[];
    dealBreakers: string[];
    detailedFeedback: string;
  }
) {
  const supabase = await getServerSupabase();

  const { data, error} = await supabase
    .from('interview_evaluations')
    .insert({
      session_id: sessionId,
      verdict: evaluation.verdict,
      overall_score: evaluation.overallScore,
      communication_score: evaluation.communicationScore,
      technical_score: evaluation.technicalScore,
      problem_solving_score: evaluation.problemSolvingScore,
      relevant_experience_score: evaluation.relevantExperienceScore,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      deal_breakers: evaluation.dealBreakers,
      detailed_feedback: evaluation.detailedFeedback,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Save real-time feedback item
 */
export async function saveFeedbackItem(
  sessionId: string,
  feedback: {
    questionNumber: number;
    question: string;
    answer: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    suggestedImprovements: string[];
    idealAnswer?: string;
    scores: {
      communication: number;
      technicalKnowledge: number;
      problemSolving: number;
      relevantExperience: number;
    };
  }
) {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from('interview_feedback_items')
    .insert({
      session_id: sessionId,
      question_number: feedback.questionNumber,
      question: feedback.question,
      answer: feedback.answer,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      opportunities: feedback.opportunities,
      threats: feedback.threats,
      suggested_improvements: feedback.suggestedImprovements,
      ideal_answer: feedback.idealAnswer,
      communication_score: feedback.scores.communication,
      technical_score: feedback.scores.technicalKnowledge,
      problem_solving_score: feedback.scores.problemSolving,
      relevant_experience_score: feedback.scores.relevantExperience,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// SUBSCRIPTION HELPER FUNCTIONS
// ============================================

/**
 * Get user subscription data
 */
export async function getUserSubscription(userId: string) {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('subscription_tier, subscription_status, interviews_used_this_month, interviews_reset_at, trial_ends_at, stripe_customer_id, stripe_subscription_id, subscription_current_period_end')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Check if user can start interview
 */
export async function canUserStartInterview(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  limit?: number;
  used?: number;
  tier: string;
}> {
  const subscription = await getUserSubscription(userId);

  if (subscription.subscription_tier === 'pro') {
    return { allowed: true, tier: 'pro' };
  }

  const freeTierLimit = parseInt(process.env.FREE_TIER_MONTHLY_LIMIT || '10', 10);
  const now = new Date();
  const resetAt = subscription.interviews_reset_at ? new Date(subscription.interviews_reset_at) : null;

  // Auto-reset if needed
  if (resetAt && now >= resetAt) {
    await resetInterviewCounter(userId);
    return { allowed: true, tier: 'free', limit: freeTierLimit, used: 0 };
  }

  const used = subscription.interviews_used_this_month || 0;

  if (used >= freeTierLimit) {
    return {
      allowed: false,
      reason: `You've reached your monthly limit of ${freeTierLimit} interviews. Upgrade to Pro for unlimited interviews.`,
      limit: freeTierLimit,
      used: used,
      tier: 'free'
    };
  }

  return { allowed: true, tier: 'free', limit: freeTierLimit, used: used };
}

/**
 * Increment interview counter (for free tier users)
 */
export async function incrementInterviewCounter(userId: string) {
  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc('increment_interview_counter', { p_user_id: userId });
  if (error) throw error;
}

/**
 * Reset interview counter
 */
export async function resetInterviewCounter(userId: string) {
  const supabase = await getServerSupabase();
  const nextResetDate = new Date();
  nextResetDate.setMonth(nextResetDate.getMonth() + 1);
  nextResetDate.setDate(1);
  nextResetDate.setHours(0, 0, 0, 0);

  const { error } = await supabase
    .from('user_profiles')
    .update({
      interviews_used_this_month: 0,
      interviews_reset_at: nextResetDate.toISOString()
    })
    .eq('id', userId);
  if (error) throw error;
}

/**
 * Update user subscription from Stripe data
 * Uses service role key for webhook access (no user session required)
 */
export async function updateUserSubscription(
  userId: string,
  subscriptionData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    tier: 'free' | 'pro';
    status: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    trialEndsAt?: Date | null;
  }
) {
  const supabase = getServiceSupabase();
  const updateData: any = {
    subscription_tier: subscriptionData.tier,
    subscription_status: subscriptionData.status,
  };

  if (subscriptionData.stripeCustomerId) updateData.stripe_customer_id = subscriptionData.stripeCustomerId;
  if (subscriptionData.stripeSubscriptionId) updateData.stripe_subscription_id = subscriptionData.stripeSubscriptionId;
  if (subscriptionData.currentPeriodStart) updateData.subscription_current_period_start = subscriptionData.currentPeriodStart.toISOString();
  if (subscriptionData.currentPeriodEnd) updateData.subscription_current_period_end = subscriptionData.currentPeriodEnd.toISOString();
  if (subscriptionData.trialEndsAt) updateData.trial_ends_at = subscriptionData.trialEndsAt.toISOString();

  const { error } = await supabase.from('user_profiles').update(updateData).eq('id', userId);
  if (error) throw error;
}

/**
 * Log subscription event for audit trail
 * Uses service role key for webhook access (no user session required)
 */
export async function logSubscriptionEvent(userId: string, eventData: {
  stripeEventId: string;
  eventType: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  data: any;
}) {
  const supabase = getServiceSupabase();
  await supabase.from('subscription_events').insert({
    user_id: userId,
    stripe_event_id: eventData.stripeEventId,
    event_type: eventData.eventType,
    stripe_customer_id: eventData.stripeCustomerId,
    stripe_subscription_id: eventData.stripeSubscriptionId,
    event_data: eventData.data,
  });
}

/**
 * Get user by Stripe customer ID
 * Uses service role key for webhook access (no user session required)
 */
export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();

  // maybeSingle returns null if no rows found (instead of throwing error)
  if (error) throw error;
  return data;
}
