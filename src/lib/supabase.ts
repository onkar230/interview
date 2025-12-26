/**
 * Supabase Client Configuration
 *
 * This file sets up the Supabase client for database operations.
 * It will be used for:
 * - User authentication
 * - Storing interview sessions
 * - Saving conversation history
 * - Storing evaluation results
 */

import { createClient } from '@supabase/supabase-js';

// TODO: Ensure Supabase environment variables are set in .env.local before using in production
// Note: Lazy initialization to prevent errors during build/development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Client-side Supabase client (uses anon key)
 * Use this for client components and browser operations
 * Note: Will throw error on actual use if env vars are not set
 */
export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Server-side Supabase client (uses service role key)
 * Use this for server-side operations that need elevated permissions
 */
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

/**
 * TODO: Set up database schema with the following tables:
 *
 * 1. users (extends Supabase auth.users)
 *    - id (uuid, primary key)
 *    - email (text)
 *    - full_name (text)
 *    - created_at (timestamp)
 *
 * 2. interview_sessions
 *    - id (uuid, primary key)
 *    - user_id (uuid, foreign key)
 *    - industry (text)
 *    - role (text)
 *    - difficulty (text)
 *    - status (text: 'pending', 'active', 'completed')
 *    - started_at (timestamp)
 *    - ended_at (timestamp)
 *    - created_at (timestamp)
 *
 * 3. interview_messages
 *    - id (uuid, primary key)
 *    - session_id (uuid, foreign key)
 *    - role (text: 'user', 'assistant')
 *    - content (text)
 *    - audio_url (text, optional)
 *    - created_at (timestamp)
 *
 * 4. interview_evaluations
 *    - id (uuid, primary key)
 *    - session_id (uuid, foreign key)
 *    - overall_score (integer)
 *    - technical_score (integer)
 *    - communication_score (integer)
 *    - problem_solving_score (integer)
 *    - feedback (text)
 *    - strengths (text[])
 *    - areas_for_improvement (text[])
 *    - created_at (timestamp)
 */

/**
 * TODO: Implement helper functions:
 * - createInterviewSession(userId, config)
 * - saveInterviewMessage(sessionId, message)
 * - getInterviewSession(sessionId)
 * - updateSessionStatus(sessionId, status)
 * - saveEvaluation(sessionId, evaluation)
 */
