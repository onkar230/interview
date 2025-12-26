import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/openai';

/**
 * POST /api/interview/message
 * Generates AI interview responses using GPT-4
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
    const { messages, industry, messageCount } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      );
    }

    // Generate AI response
    const response = await generateResponse(messages, industry);

    // Determine if interview should end (after ~10-12 questions)
    const shouldEnd = messageCount >= 10;

    // If approaching end, add a hint to wrap up
    let finalResponse = response;
    if (messageCount === 9) {
      finalResponse += '\n\nWe\'re approaching the end of our interview. I have one final question for you.';
    } else if (shouldEnd) {
      finalResponse += '\n\nThank you for your responses. That concludes our interview today.';
    }

    return NextResponse.json({
      response: finalResponse,
      shouldEnd,
      messageCount: messageCount + 1,
    });
  } catch (error) {
    console.error('Error generating message:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to generate response: ${errorMessage}` },
      { status: 500 }
    );
  }
}
