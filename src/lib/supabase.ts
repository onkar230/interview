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
 * Get interview session with messages
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

  return { session, messages };
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
