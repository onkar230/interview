/**
 * OpenAI Client Configuration
 *
 * This file sets up the OpenAI client for the AI Mock Interview Platform.
 * It will be used for:
 * - Generating interview questions
 * - Real-time conversation with GPT-4
 * - Evaluating candidate responses
 * - Text-to-Speech for voice interactions
 */

import OpenAI from 'openai';

// TODO: Ensure OPENAI_API_KEY is set in .env.local before using in production
// Note: Lazy initialization to prevent errors during build/development
export const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

/**
 * Configuration for different OpenAI features
 */
export const OPENAI_CONFIG = {
  // Model for interview conversations (using cheaper model for cost efficiency)
  // gpt-4o-mini: $0.15/1M input, $0.60/1M output (60x cheaper than GPT-4 Turbo!)
  CHAT_MODEL: 'gpt-4o-mini' as const,

  // Model for real-time feedback (cheap is fine here)
  FEEDBACK_MODEL: 'gpt-4o-mini' as const,

  // Model for text-to-speech
  TTS_MODEL: 'tts-1' as const,
  TTS_VOICE: 'alloy' as const,

  // Model for evaluations (keep quality high for final eval)
  // gpt-4-turbo: $10/1M input, $30/1M output (better quality for final analysis)
  EVALUATION_MODEL: 'gpt-4-turbo' as const,

  // Temperature settings
  TEMPERATURE: {
    CREATIVE: 0.8,
    BALANCED: 0.7,
    DETERMINISTIC: 0.3,
  },
} as const;

/**
 * Helper Functions for OpenAI Integration
 */

/**
 * Transcribes audio to text using Whisper
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const client = getOpenAIClient();

  // Convert Blob to File (required by OpenAI API)
  const audioFile = new File([audioBlob], 'audio.webm', { type: audioBlob.type });

  const transcription = await client.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  });

  return transcription.text;
}

/**
 * Generates an AI response based on conversation history
 */
export async function generateResponse(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  industry: string
): Promise<string> {
  const client = getOpenAIClient();

  const completion = await client.chat.completions.create({
    model: OPENAI_CONFIG.CHAT_MODEL,
    messages,
    temperature: OPENAI_CONFIG.TEMPERATURE.BALANCED,
    max_tokens: 500,
  });

  return completion.choices[0]?.message?.content || '';
}

/**
 * Converts text to speech using OpenAI TTS
 */
export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  const client = getOpenAIClient();

  const mp3 = await client.audio.speech.create({
    model: OPENAI_CONFIG.TTS_MODEL,
    voice: OPENAI_CONFIG.TTS_VOICE,
    input: text,
  });

  return mp3.arrayBuffer();
}

/**
 * Detects filler words and verbal crutches in the answer
 */
function detectFillerWords(answer: string): { word: string; count: number }[] {
  const fillers = [
    { pattern: /\b(you know|y'know)\b/gi, word: 'you know' },
    { pattern: /\b(like)\b/gi, word: 'like' },
    { pattern: /\b(um|uh|umm|uhh)\b/gi, word: 'um/uh' },
    { pattern: /\b(actually)\b/gi, word: 'actually' },
    { pattern: /\b(basically)\b/gi, word: 'basically' },
    { pattern: /\b(literally)\b/gi, word: 'literally' },
    { pattern: /\b(kind of|sort of|kinda|sorta)\b/gi, word: 'kind of/sort of' },
    { pattern: /\b(I think)\b/gi, word: 'I think' },
    { pattern: /\b(I mean)\b/gi, word: 'I mean' },
    { pattern: /\b(right\?|you see|you understand)\b/gi, word: 'right/you see' },
  ];

  const detected: { word: string; count: number }[] = [];

  for (const filler of fillers) {
    const matches = answer.match(filler.pattern);
    if (matches && matches.length >= 2) { // Only flag if used 2+ times
      detected.push({ word: filler.word, count: matches.length });
    }
  }

  // Sort by count (most frequent first)
  return detected.sort((a, b) => b.count - a.count);
}

/**
 * Analyzes a single answer in real-time and provides SWOT feedback
 */
export async function analyzeAnswer(params: {
  question: string;
  answer: string;
  industry: string;
  conversationHistory: Array<{ role: string; content: string }>;
}): Promise<{
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}> {
  const client = getOpenAIClient();
  const { question, answer, industry, conversationHistory } = params;

  // Detect filler words
  const fillerWords = detectFillerWords(answer);
  const fillerWordInfo = fillerWords.length > 0
    ? `\n\nFILLER WORDS DETECTED:\n${fillerWords.map(f => `- Used "${f.word}" ${f.count} times`).join('\n')}\nINCLUDE THIS IN WEAKNESSES/THREATS: The candidate should eliminate these verbal fillers to sound more confident and articulate.`
    : '';

  const contextInfo = conversationHistory.length > 0
    ? `\n\nPrevious conversation context:\n${conversationHistory.slice(-4).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}`
    : '';

  const analysisPrompt = `You are an expert interviewer analyzing a candidate's answer in real-time during a ${industry} industry interview.

Question asked: "${question}"

Candidate's answer: "${answer}"
${contextInfo}
${fillerWordInfo}

Provide HONEST, CRITICAL feedback in SWOT format. Be specific to THIS answer, not generic.

CRITICAL ANALYSIS REQUIREMENTS:

1. ANSWER STRUCTURE CHECK:
   - Does the answer use a proper structure (STAR: Situation, Task, Action, Result | CAR: Context, Action, Result | PEEL: Point, Evidence, Explain, Link)?
   - If NO structure is used or the answer is vague/rambling, YOU MUST flag this in WEAKNESSES or OPPORTUNITIES
   - Specifically recommend using STAR, CAR, or PEEL method if the answer lacks structure

2. HONESTY OVER KINDNESS:
   - If the answer is terrible, vague, or one-sentence, DO NOT invent fake strengths
   - It's OKAY to have 0 strengths if the answer is genuinely poor
   - Be honest: "The answer was too vague", "No specific examples provided", "Answer lacks substance"

3. RED FLAGS TO CATCH:
   - One-word or one-sentence answers (e.g., "I'm good enough") → FLAG IN THREATS
   - No concrete examples, metrics, or specifics → FLAG IN WEAKNESSES
   - Rambling without clear point → FLAG IN WEAKNESSES
   - Generic platitudes ("I work hard", "I'm a team player") → FLAG IN OPPORTUNITIES

SWOT GUIDELINES:
- Strengths: What they ACTUALLY did well (0-2 points). ONLY include if genuinely good. Empty array is fine.
- Weaknesses: What's wrong with the answer (1-3 points, brutally honest). ALWAYS mention lack of structure if applicable.
- Opportunities: What they should have done (1-3 points). Include "Use STAR/CAR/PEEL method" if needed.
- Threats: Critical red flags (0-2 points). Include for terrible/lazy answers.

Each point should be:
- One sentence maximum
- Brutally honest and specific
- Actionable (tell them HOW to fix it)
- Based on what they ACTUALLY said, not what you wish they said

Respond in JSON format:
{
  "strengths": ["actual strength 1"] or [],
  "weaknesses": ["specific weakness 1", "Answer lacks structure - use STAR method (Situation, Task, Action, Result)"],
  "opportunities": ["missed point 1", "Could have provided specific metrics or numbers"],
  "threats": ["Answer is too vague and lacks substance"] or []
}`;

  const completion = await client.chat.completions.create({
    model: OPENAI_CONFIG.FEEDBACK_MODEL,
    messages: [
      { role: 'system', content: analysisPrompt },
      { role: 'user', content: 'Analyze this answer now.' }
    ],
    temperature: OPENAI_CONFIG.TEMPERATURE.DETERMINISTIC,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

  return {
    strengths: result.strengths || [],
    weaknesses: result.weaknesses || [],
    opportunities: result.opportunities || [],
    threats: result.threats || [],
  };
}

/**
 * Evaluates an interview conversation and provides detailed feedback
 */
export async function evaluateInterview(
  transcript: Array<{ role: string; content: string }>,
  industry: string
): Promise<{
  verdict: 'pass' | 'borderline' | 'fail';
  strengths: string[];
  weaknesses: string[];
  dealBreakers: string[];
  detailedFeedback: string;
}> {
  const client = getOpenAIClient();

  const evaluationPrompt = `You are an expert interviewer evaluating a job interview transcript. Analyze the following interview conversation and provide a comprehensive evaluation.

Industry: ${industry}

Evaluate based on:
1. Technical knowledge and competence
2. Communication skills
3. Problem-solving ability
4. Relevant experience
5. Cultural fit and professionalism

Provide your evaluation in the following JSON format:
{
  "verdict": "pass" | "borderline" | "fail",
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "dealBreakers": ["deal breaker 1", ...] (if any critical issues),
  "detailedFeedback": "A comprehensive paragraph about the candidate's performance"
}

Be fair but honest. Pass means strong hire, borderline means potential with reservations, fail means clear no-hire.`;

  const messages = [
    { role: 'system' as const, content: evaluationPrompt },
    {
      role: 'user' as const,
      content: `Interview Transcript:\n\n${transcript.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}`
    }
  ];

  const completion = await client.chat.completions.create({
    model: OPENAI_CONFIG.EVALUATION_MODEL,
    messages,
    temperature: OPENAI_CONFIG.TEMPERATURE.DETERMINISTIC,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

  return {
    verdict: result.verdict || 'borderline',
    strengths: result.strengths || [],
    weaknesses: result.weaknesses || [],
    dealBreakers: result.dealBreakers || [],
    detailedFeedback: result.detailedFeedback || 'No feedback provided.',
  };
}
