import { NextRequest, NextResponse } from 'next/server';
import { evaluateInterview } from '@/lib/openai';

/**
 * POST /api/interview/evaluate
 * Evaluates an interview conversation and provides feedback
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
    const { transcript, industry } = body;

    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json(
        { error: 'Invalid transcript format' },
        { status: 400 }
      );
    }

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      );
    }

    if (transcript.length < 2) {
      return NextResponse.json(
        { error: 'Transcript too short to evaluate' },
        { status: 400 }
      );
    }

    // Generate evaluation
    const evaluation = await evaluateInterview(transcript, industry);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Error evaluating interview:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to evaluate interview: ${errorMessage}` },
      { status: 500 }
    );
  }
}
