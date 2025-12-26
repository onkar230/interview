import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/openai';

/**
 * POST /api/interview/audio
 * Transcribes audio to text using OpenAI Whisper
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

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Check file size (OpenAI limit is 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    // Transcribe audio
    const text = await transcribeAudio(audioFile);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No speech detected in audio' },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Error transcribing audio:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to transcribe audio: ${errorMessage}` },
      { status: 500 }
    );
  }
}
