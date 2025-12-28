import { NextRequest, NextResponse } from 'next/server';
import { generateStreamingResponse } from '@/lib/openai';

/**
 * POST /api/interview/message
 * Generates AI interview responses using GPT-4 with streaming
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
    const { messages, industry, messageCount, maxQuestions } = body;

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

    // Generate streaming AI response
    const stream = await generateStreamingResponse(messages, industry);

    // Determine if interview should end
    const shouldEnd = messageCount >= (maxQuestions || 10);

    // Return streaming response with metadata
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Should-End': shouldEnd.toString(),
        'X-Message-Count': (messageCount + 1).toString(),
      },
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
