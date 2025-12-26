import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech } from '@/lib/openai';

/**
 * POST /api/interview/tts
 * Converts text to speech using OpenAI TTS
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
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (text.length > 4096) {
      return NextResponse.json(
        { error: 'Text too long. Maximum length is 4096 characters.' },
        { status: 400 }
      );
    }

    // Generate speech
    const audioBuffer = await textToSpeech(text);

    // Return audio as response
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating speech:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to generate speech: ${errorMessage}` },
      { status: 500 }
    );
  }
}
