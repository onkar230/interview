/**
 * TypeScript Type Definitions for AI Mock Interview Platform
 *
 * This file contains all the core type definitions used throughout the application.
 */

import { Industry, Difficulty } from '@/lib/interview-prompts';

/**
 * User types
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

/**
 * Interview Session types
 */
export type InterviewStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface InterviewConfig {
  industry: Industry;
  role: string;
  difficulty: Difficulty;
  duration?: number; // in minutes
  focusAreas?: string[];
}

export interface InterviewSession {
  id: string;
  userId: string;
  industry: Industry;
  role: string;
  difficulty: Difficulty;
  status: InterviewStatus;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Interview Message types
 */
export type MessageRole = 'user' | 'assistant' | 'system';

export interface InterviewMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  audioUrl?: string;
  timestamp: string;
  createdAt: string;
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: string;
}

/**
 * Interview Evaluation types
 */
export interface ScoreBreakdown {
  technical: number; // 0-100
  communication: number; // 0-100
  problemSolving: number; // 0-100
  experience: number; // 0-100
}

export interface InterviewEvaluation {
  id: string;
  sessionId: string;
  overallScore: number; // 0-100
  scores: ScoreBreakdown;
  feedback: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  createdAt: string;
}

/**
 * API Request/Response types
 */

// Start Interview
export interface StartInterviewRequest {
  config: InterviewConfig;
}

export interface StartInterviewResponse {
  sessionId: string;
  session: InterviewSession;
  initialMessage: string;
}

// Send Message
export interface SendMessageRequest {
  sessionId: string;
  message: string;
  audio?: Blob | File;
}

export interface SendMessageResponse {
  message: InterviewMessage;
  response: string;
  audioUrl?: string;
}

// Evaluate Interview
export interface EvaluateInterviewRequest {
  sessionId: string;
}

export interface EvaluateInterviewResponse {
  evaluation: InterviewEvaluation;
}

// Text-to-Speech
export interface TextToSpeechRequest {
  text: string;
  voice?: string;
}

export interface TextToSpeechResponse {
  audioUrl: string;
}

/**
 * Audio Recording types
 */
export interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
}

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioLevel: number;
}

/**
 * Form types
 */
export interface InterviewSelectionForm {
  industry: Industry;
  role: string;
  difficulty: Difficulty;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  fullName: string;
  confirmPassword: string;
}

/**
 * UI State types
 */
export interface InterviewUIState {
  isLoading: boolean;
  isInterviewActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  currentQuestion: number;
  totalQuestions: number;
  error?: string;
}

/**
 * Database types (matching Supabase schema)
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'createdAt'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      interview_sessions: {
        Row: InterviewSession;
        Insert: Omit<InterviewSession, 'id' | 'createdAt'>;
        Update: Partial<Omit<InterviewSession, 'id'>>;
      };
      interview_messages: {
        Row: InterviewMessage;
        Insert: Omit<InterviewMessage, 'id' | 'createdAt'>;
        Update: Partial<Omit<InterviewMessage, 'id'>>;
      };
      interview_evaluations: {
        Row: InterviewEvaluation;
        Insert: Omit<InterviewEvaluation, 'id' | 'createdAt'>;
        Update: Partial<Omit<InterviewEvaluation, 'id'>>;
      };
    };
  };
}

/**
 * Utility types
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

/**
 * TODO: Add types for:
 * - Real-time audio streaming
 * - WebSocket events
 * - Analytics and tracking
 * - Payment/subscription (if applicable)
 */
