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

  // Model for evaluations (use gpt-4o for reliability and speed)
  // gpt-4o: $2.50/1M input, $10/1M output (fast, reliable, high quality)
  EVALUATION_MODEL: 'gpt-4o' as const,

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
  console.log('[openai/transcribeAudio] ===== WHISPER API CALL START =====');
  const startTime = Date.now();

  const client = getOpenAIClient();

  // Convert Blob to File (required by OpenAI API)
  const audioFile = new File([audioBlob], 'audio.webm', { type: audioBlob.type });
  const fileSizeMB = (audioFile.size / 1024 / 1024).toFixed(2);
  console.log(`[openai/transcribeAudio] File details: ${fileSizeMB}MB, type: ${audioFile.type}`);

  try {
    // Add timeout to prevent hanging (Whisper typically takes 5-15 seconds for long audio)
    const timeoutMs = 50000; // 50 seconds timeout
    console.log(`[openai/transcribeAudio] Calling Whisper API (timeout: ${timeoutMs}ms)...`);

    const apiCallStart = Date.now();
    const transcriptionPromise = client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      prompt: 'Professional job interview. Transcribe exactly what is spoken - do not add words that were not said. If the speaker says filler words like "um" or "like", include them. Do not hallucinate or insert words like "actually" unless clearly spoken.',
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        const elapsed = Date.now() - apiCallStart;
        console.error(`[openai/transcribeAudio] ⏱️ TIMEOUT after ${elapsed}ms`);
        reject(new Error('Whisper transcription timeout after 50 seconds'));
      }, timeoutMs)
    );

    const transcription = await Promise.race([transcriptionPromise, timeoutPromise]);
    const apiCallDuration = Date.now() - apiCallStart;
    const totalDuration = Date.now() - startTime;

    console.log(`[openai/transcribeAudio] ✓ Whisper API success`);
    console.log(`[openai/transcribeAudio] API call duration: ${apiCallDuration}ms (${(apiCallDuration / 1000).toFixed(2)}s)`);
    console.log(`[openai/transcribeAudio] Total duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
    console.log(`[openai/transcribeAudio] Text length: ${transcription.text.length} chars`);
    console.log(`[openai/transcribeAudio] ===== WHISPER API CALL END =====`);

    return transcription.text;
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[openai/transcribeAudio] ❌ FAILED after ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
    console.error('[openai/transcribeAudio] Error details:', error);

    if (error instanceof Error) {
      console.error('[openai/transcribeAudio] Error name:', error.name);
      console.error('[openai/transcribeAudio] Error message:', error.message);
      throw new Error(`Whisper transcription failed: ${error.message}`);
    }
    throw error;
  }
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
 * Generates a streaming AI response based on conversation history
 * Returns a stream that can be piped to the response
 */
export async function generateStreamingResponse(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  industry: string
): Promise<ReadableStream> {
  const client = getOpenAIClient();

  const stream = await client.chat.completions.create({
    model: OPENAI_CONFIG.CHAT_MODEL,
    messages,
    temperature: OPENAI_CONFIG.TEMPERATURE.BALANCED,
    max_tokens: 500,
    stream: true,
  });

  // Convert OpenAI stream to ReadableStream
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            // Send as Server-Sent Events format
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        }
        // Send done signal
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
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
  suggestedImprovements: string[];
  scores: {
    communication: number;
    technicalKnowledge: number;
    problemSolving: number;
    relevantExperience: number;
  };
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

  // Industry-specific scoring categories
  const scoringCategories = industry === 'law'
    ? `- communication: How clearly they articulated their answer (0-10)
- commercialAwareness: Understanding of business, legal market, and commercial issues (0-10)
- problemSolving: Analytical thinking and approach (0-10)
- relevantExperience: Quality and relevance of examples (0-10)`
    : `- communication: How clearly they articulated their answer (0-10)
- technicalKnowledge: Demonstration of role-specific expertise (0-10)
- problemSolving: Analytical thinking and approach (0-10)
- relevantExperience: Quality and relevance of examples (0-10)`;

  // Industry-specific analysis instructions
  const industrySpecificInstructions = industry === 'law'
    ? `
CRITICAL - LAW FIRM SPECIFIC ANALYSIS:
- Focus on: Commercial awareness, structured thinking (STAR method), professional communication
- Assess whether they demonstrated knowledge of the legal market, firms, or deals
- Check for ethical awareness and professional standards (SRA Code of Conduct)
- Evaluate use of structure: "Firstly... Secondly... Finally..."
- DO NOT assess technical coding accuracy - this is a law interview
- British English and legal terminology expected

FATAL ERRORS TO FLAG IN THREATS (Score 0-1):
✗ Purely money-motivated ("I love money", "high salary", "prestige only") → Score: 0-1/10
✗ Unethical suggestions (hiding evidence, lying to clients, following unethical instructions) → Score: 0/10
✗ Generic firm praise without specifics ("You're prestigious") → Score: 1-2/10
✗ No commercial understanding (can't connect news to legal services) → Score: 2-3/10
✗ Can't distinguish law from banking/consulting → Score: 1-2/10

LAW INTERVIEW SCORING SPECIFICS:
- "I love money" / "high salary" motivation → 0-1/10 for relevantExperience, 0-1/10 for commercialAwareness
- Generic firm answer with no research → 2-3/10 maximum for commercialAwareness
- No commercial awareness → 2-3/10 for commercialAwareness
- Unethical response → 0-1/10 across all categories
- Strong commercial awareness + genuine interest + structured → 8-9/10
`
    : industry === 'technology'
    ? `
CRITICAL - TECH INTERVIEW SPECIFIC ANALYSIS:
- Focus on: Technical accuracy, algorithmic thinking, system design principles, communication clarity
- If they described an algorithm/data structure, assess Big O complexity understanding
- For entry-level: Focus on OOP, data structures, NOT distributed systems
- For senior: Assess scalability, architecture decisions, distributed systems knowledge
- Evaluate their ability to EXPLAIN technical concepts verbally (this is voice-based)
- DO NOT assess commercial awareness or legal knowledge - this is a tech interview

FATAL ERRORS TO FLAG IN THREATS (Score 0-1):
✗ Cannot explain code/solution in plain English → Score: 0-1/10
✗ Silent coder (no thought process explained) → Score: 1-2/10
✗ Wrong Big O complexity with no correction → Score: 1-2/10
✗ Entry-level claiming distributed systems expertise they don't have → Score: 2-3/10
✗ Uses jargon but can't define it → Score: 0-1/10

TECH INTERVIEW SCORING SPECIFICS:
- Cannot verbally explain technical concepts → 1/10 for communication
- Wrong algorithmic complexity → 2-3/10 for problemSolving
- No code explanation / "I would just write it" → 2/10 for communication
- Silent problem-solving → 2/10 for problemSolving
- Generic "I'm passionate about tech" → 3-4/10
- Strong technical explanation with complexity analysis → 8-9/10
`
    : '';

  const analysisPrompt = `You are an expert interviewer analysing a candidate's answer in real-time during a ${industry} industry interview.

Question asked: "${question}"

Candidate's answer: "${answer}"
${contextInfo}
${fillerWordInfo}

${industrySpecificInstructions}

Provide HONEST, CRITICAL feedback in SWOT format. Be specific to THIS answer, not generic.

LANGUAGE REQUIREMENT:
- Use British English spelling throughout (e.g., "organised", "analyse", "realise", "behaviour", "specialise", "recognise")
- Apply this to all feedback sections: strengths, weaknesses, opportunities, threats, and suggested improvements

CRITICAL ANALYSIS REQUIREMENTS:

1. ANSWER STRUCTURE CHECK:
   - ONLY mention STAR/CAR/PEEL if the answer is genuinely rambling, disorganized, or jumping between topics
   - If the answer has a clear flow and makes sense, DO NOT mention structure frameworks
   - Structure feedback should be RARE - only for truly confusing answers
   - Many good answers don't explicitly use STAR and that's perfectly fine

2. BALANCED FEEDBACK - FIND WHAT WORKED:
   - Even for mediocre answers, find at least ONE thing they did well (e.g., "Attempted to provide context", "Spoke clearly")
   - ONLY give 0 strengths for truly terrible answers (one-word, completely off-topic, unethical)
   - For decent answers (not great, just okay), acknowledge what worked before suggesting improvements
   - Be honest about weaknesses, but don't ignore positives

3. RED FLAGS TO CATCH:
   - One-word or one-sentence answers (e.g., "I'm good enough") → FLAG IN THREATS
   - No concrete examples, metrics, or specifics → FLAG IN WEAKNESSES
   - Actually rambling without clear point → FLAG IN WEAKNESSES (but don't just say "use STAR")
   - Generic platitudes ("I work hard", "I'm a team player") → FLAG IN OPPORTUNITIES

SWOT GUIDELINES:
- Strengths: What they did well (1-3 points). Find positives even in average answers (e.g., "Provided context", "Spoke confidently", "Used a relevant example"). ONLY give 0 strengths for truly awful answers.
- Weaknesses: What needs improvement (1-3 points, honest but constructive). Focus on CONTENT issues, not structure.
- Opportunities: What they should have done differently (1-3 points). Be specific about what was missing.
- Threats: Critical red flags (0-2 points). ONLY for serious issues (unethical, one-word answers, completely off-topic).
- Suggested Improvements: Specific actionable points to strengthen their answer (2-4 points). Based on what they said, what content/examples/metrics would make it stronger?

IMPORTANT: STOP mentioning STAR/CAR/PEEL method in every answer. Only mention it if the answer is genuinely confusing or disorganized.

Each point should be:
- One sentence maximum
- Brutally honest and specific
- Actionable (tell them HOW to fix it)
- Based on what they ACTUALLY said, not what you wish they said
- VARIED - don't repeat the same feedback every time

SUGGESTED IMPROVEMENTS EXAMPLES:
- "Mention specific metrics or numbers (e.g., 'increased sales by 25%')"
- "Include the outcome or result of your actions"
- "Explain the specific challenges you faced in more detail"
- "Add context about why this was important to the business"
- "Describe what you learned from this experience"

SCORING (0-10 for each category):
Also provide numerical scores for this answer in these categories:
${scoringCategories}

CRITICAL SCORING GUIDELINES - BE BRUTALLY HONEST (0-10 SCALE):

0-1: TERRIBLE (Red flags, one-word answers, completely inappropriate, unethical, "I love money")
  Examples: "I don't know", "I love money", "Because it's easy", unethical suggestions

2-3: VERY POOR (No substance, extremely vague, shows zero preparation)
  Examples: "I work hard", "I'm a team player" (no examples), generic platitudes

4-5: POOR (Weak answer, lacks specifics, minimal effort, vague)
  Examples: Generic answers with no concrete details, no metrics, surface-level thinking

6: BELOW AVERAGE (Some substance but needs major improvement, lacks depth)
  Examples: Provides examples but vague, no outcomes mentioned, limited detail

7: AVERAGE (Decent answer, some specifics, could be stronger)
  Examples: Has structure, mentions outcomes, but could add more metrics/depth

8: GOOD (Strong answer with specifics, clear examples, demonstrates competence)
  Examples: Uses STAR naturally, provides metrics, shows impact, demonstrates expertise

9: VERY GOOD (Exceptional answer, detailed, compelling, shows deep understanding)
  Examples: Detailed examples with metrics, clear business impact, insightful analysis

10: OUTSTANDING (Textbook perfect answer, interviewer would be impressed)
  Examples: Everything above + unique insights, demonstrates exceptional expertise

BE FAIR AND CALIBRATED:
- If they gave a one-word answer or unethical response, score 0-1
- If they were vague with no examples, score 3-5
- Decent answers with some substance should get 6-7 (this is positive - they're learning!)
- Good answers with specifics and structure should get 7-8
- Reserve 9-10 for truly exceptional answers that would impress senior interviewers
- Remember: This is PRACTICE. A 6-7 is good progress, not a failure.

Respond in JSON format:
{
  "strengths": ["Provided relevant context", "Spoke clearly and confidently"],
  "weaknesses": ["Could have included specific metrics", "Limited detail on outcomes"],
  "opportunities": ["Could have used the STAR method for better structure", "Could have provided specific numbers or results"],
  "threats": [] or ["One-word answer - needs substantial improvement"],
  "suggestedImprovements": ["Add specific metrics or outcomes", "Explain the business impact", "Describe what you learned"],
  "scores": {
    "communication": 7,
    ${industry === 'law' ? '"commercialAwareness": 6' : '"technicalKnowledge": 6'},
    "problemSolving": 6,
    "relevantExperience": 7
  }
}`;

  const completion = await client.chat.completions.create({
    model: OPENAI_CONFIG.FEEDBACK_MODEL,
    messages: [
      { role: 'system', content: analysisPrompt },
      { role: 'user', content: 'Analyse this answer now.' }
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
    suggestedImprovements: result.suggestedImprovements || [],
    scores: {
      communication: result.scores?.communication || 5,
      technicalKnowledge: result.scores?.technicalKnowledge || result.scores?.commercialAwareness || 5,
      problemSolving: result.scores?.problemSolving || 5,
      relevantExperience: result.scores?.relevantExperience || 5,
    },
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

  console.log(`Evaluating interview with ${transcript.length} messages for ${industry} industry`);

  // Industry-specific fatal error checks
  const industryFatalErrorChecks = industry === 'law'
    ? `

CRITICAL - LAW FIRM FATAL ERROR CHECKS:

Before assigning verdict, scan the entire transcript for these INSTANT FAIL scenarios:

1. ETHICS VIOLATIONS (AUTOMATIC FAIL):
   - Suggested hiding evidence, lying to clients, or other unethical conduct
   - No understanding of SRA Code of Conduct or professional obligations
   - Would follow unethical partner instructions without question
   → If found: verdict = "fail", add to dealBreakers

2. GENERIC FIRM ANSWERS (STRONG NEGATIVE):
   - "Why this firm?" answered with only "You're prestigious/global/award-winning"
   - No specific deals, partners, practice areas, or research demonstrated
   → If found: Major weakness, likely "fail" or "borderline"

3. PRESTIGE CHASING (NEGATIVE):
   - Only wants law for prestige/salary, no genuine interest in legal work
   - Can't distinguish law from banking/consulting
   → If found: Add to weaknesses

4. NO COMMERCIAL AWARENESS:
   - Mentioned news stories but can't explain commercial implications for law firms
   - No understanding of how law firms make money or serve clients
   → If found: Major weakness

5. UNSTRUCTURED RAMBLING:
   - Consistently gave long, unstructured answers without STAR or clear points
   - No improvement even when prompted to structure
   → If found: Add to weaknesses

Focus evaluation on:
- Commercial awareness (critical for Magic Circle)
- Structured communication (lawyers must be clear)
- Ethical judgment (non-negotiable)
- Genuine motivation for law career
- Knowledge of legal market/firms
`
    : industry === 'technology'
    ? `

CRITICAL - TECH INTERVIEW FATAL ERROR CHECKS:

Before assigning verdict, scan the entire transcript for these INSTANT FAIL scenarios:

1. CANNOT EXPLAIN CODE VERBALLY (AUTOMATIC FAIL):
   - Could not explain technical concepts in plain English
   - Repeatedly said "I would just write the code" without verbal explanation
   - Used jargon but couldn't define it when asked
   → If found: verdict = "fail", add to dealBreakers: "Cannot communicate technical concepts verbally - critical failure for collaborative engineering"

2. NO ALGORITHMIC THINKING:
   - Never considered Big O complexity when asked
   - Gave incorrect complexity analysis and didn't correct when probed
   - Proposed inefficient solutions with no optimization awareness
   → If found: Major weakness, likely "fail" for mid/senior roles

3. SILENT CODER SYNDROME:
   - Gave instant answers without explaining thought process
   - No "thinking out loud" even when explicitly asked
   - Didn't walk through tradeoffs or alternatives
   → If found: Add to dealBreakers: "Silent problem-solving approach - unsuitable for collaborative whiteboard interviews"

4. LEVEL MISMATCH (WRONG KNOWLEDGE FOR EXPERIENCE):
   - Entry-level claiming distributed systems expertise but clearly doesn't understand
   - Senior describing only basic OOP without scalability/architecture thinking
   → If found: Add to weaknesses

5. LACK OF OWNERSHIP:
   - Always said "we" but couldn't explain their specific contribution
   - No concrete examples of individual technical decisions
   → If found: Major weakness

Focus evaluation on:
- Verbal communication of technical concepts (CRITICAL for remote/collaborative work)
- Algorithmic thinking and complexity analysis
- System design appropriate to level
- Individual contribution clarity
- Problem-solving process (not just solutions)
`
    : `

Evaluate based on:
1. Technical knowledge and competence
2. Communication skills
3. Problem-solving ability
4. Relevant experience
5. Cultural fit and professionalism
`;

  const evaluationPrompt = `You are an expert interviewer evaluating a job interview transcript. Analyse the following interview conversation and provide a comprehensive evaluation.

Industry: ${industry}

${industryFatalErrorChecks}

LANGUAGE REQUIREMENT:
- Use British English spelling throughout (e.g., "organised", "analyse", "realise", "behaviour", "specialise", "recognise")
- Apply this to all evaluation sections: strengths, weaknesses, deal breakers, and detailed feedback

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

  try {
    const completion = await client.chat.completions.create({
      model: OPENAI_CONFIG.EVALUATION_MODEL,
      messages,
      temperature: OPENAI_CONFIG.TEMPERATURE.DETERMINISTIC,
      response_format: { type: 'json_object' },
      max_tokens: 2000, // Ensure enough tokens for detailed evaluation
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in evaluation response');
    }

    const result = JSON.parse(content);
    console.log('Evaluation completed successfully');

    return {
      verdict: result.verdict || 'borderline',
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      dealBreakers: result.dealBreakers || [],
      detailedFeedback: result.detailedFeedback || 'No feedback provided.',
    };
  } catch (error) {
    console.error('Error in evaluateInterview:', error);
    if (error instanceof Error) {
      throw new Error(`Evaluation failed: ${error.message}`);
    }
    throw error;
  }
}
