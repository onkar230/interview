import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Increase function timeout for ideal answer generation (can take 10-20 seconds)
export const maxDuration = 60; // 60 seconds (requires Vercel Pro plan)

export async function POST(request: NextRequest) {
  try {
    const { question, answer, industry, role, difficulty, company } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!answer) {
      return NextResponse.json(
        { error: 'Answer is required' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert interviewer and career coach. The candidate just answered an interview question. Your job is to show them how to IMPROVE their specific answer, not give a generic template.

QUESTION ASKED: "${question}"

CANDIDATE'S ACTUAL ANSWER: "${answer}"

CONTEXT:
- Industry: ${industry || 'General'}
- Role: ${role || 'General'}
- Level: ${difficulty || 'mid-level'}
${company ? `- Company: ${company}` : ''}

CRITICAL INSTRUCTIONS:
- START with what they actually said - acknowledge their answer
- BUILD on their answer, don't replace it
- Show how to enhance THEIR specific points, not generic advice
- Keep their voice and examples, just make them stronger

LANGUAGE TONE (VERY IMPORTANT):
- Sound like a REAL PERSON in a conversation, NOT a corporate script
- Avoid overly formal phrases like "I'm thrilled and prestigious", "delighted to", "esteemed", "honour", "privileged"
- Don't use corporate buzzwords or flowery language
- Use natural, conversational English like you're talking to a friend
- Be authentic and genuine, not rehearsed or scripted
- Good: "I'm really excited about...", "What drew me to..."
- Bad: "I'm honoured and privileged...", "It would be a tremendous opportunity..."
- Think: How would a confident, articulate person NATURALLY speak?

Provide in this format (markdown):

## What You Said
[1-2 sentence summary of their key points]

## How to Strengthen This Answer
[3-5 specific, actionable improvements based on what they said - include both content improvements (what to add, what metrics/examples would help) and delivery improvements (structure, clarity, confidence)]

## Enhanced Version of YOUR Answer
[Rewrite THEIR answer with improvements - keep their examples/stories but add:
- More specific metrics/numbers
- Clearer structure (if needed)
- Stronger action verbs (but natural ones, not corporate jargon)
- Concrete outcomes
- Business impact
- CRITICAL: Use natural, conversational language that sounds authentic, NOT overly formal or scripted]

## Why This Works
[1-2 sentences explaining what makes the enhanced version stronger]

IMPORTANT:
- This should feel like "your answer, but better" - NOT a completely different answer
- Use their specific examples and experiences
- Sound like a REAL PERSON talking naturally, not reading from a script
- Avoid overly sophisticated vocabulary - be clear and conversational
- Use British English spelling throughout (e.g., "organised", "analyse", "realise", "behaviour")`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career coach and interview trainer. Provide clear, actionable guidance using British English spelling (e.g., "organised", "analyse", "realise", "behaviour").',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const idealAnswer = completion.choices[0].message.content || '';

    return NextResponse.json({
      idealAnswer,
      question,
    });
  } catch (error) {
    console.error('Error generating ideal answer:', error);
    return NextResponse.json(
      { error: 'Failed to generate ideal answer' },
      { status: 500 }
    );
  }
}
