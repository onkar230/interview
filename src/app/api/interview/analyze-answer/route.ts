import { NextRequest, NextResponse } from 'next/server';
import { analyzeAnswer } from '@/lib/openai';

/**
 * POST /api/interview/analyze-answer
 * Provides real-time SWOT feedback for a candidate's answer
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { question, answer, industry, conversationHistory } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      );
    }

    // Generate SWOT analysis for the answer
    const feedback = await analyzeAnswer({
      question,
      answer,
      industry,
      conversationHistory: conversationHistory || [],
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error analyzing answer:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to analyze answer: ${errorMessage}` },
      { status: 500 }
    );
  }
}
