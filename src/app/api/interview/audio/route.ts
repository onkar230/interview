import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/openai';

// Increase function timeout for large audio files (Whisper can take 10-15 seconds)
// Free tier: 10s max, Hobby tier: 10s default (need to set), Pro tier: 60s max
export const maxDuration = 60; // 60 seconds (requires Vercel Pro plan)

/**
 * POST /api/interview/audio
 * Transcribes audio to text using OpenAI Whisper
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[audio/route] ========== NEW TRANSCRIPTION REQUEST ==========');
  console.log('[audio/route] Request started at:', new Date().toISOString());

  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('[audio/route] ERROR: No OpenAI API key configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Parse form data
    console.log('[audio/route] Parsing form data...');
    const formDataStartTime = Date.now();
    const formData = await request.formData();
    const formDataDuration = Date.now() - formDataStartTime;
    console.log(`[audio/route] Form data parsed in ${formDataDuration}ms`);

    const audioFile = formData.get('audio') as Blob | null;

    if (!audioFile) {
      console.error('[audio/route] ERROR: No audio file in request');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const fileSizeMB = (audioFile.size / 1024 / 1024).toFixed(2);
    console.log(`[audio/route] Audio file size: ${fileSizeMB} MB (${audioFile.size} bytes)`);
    console.log(`[audio/route] Audio file type: ${audioFile.type}`);

    // Check file size (OpenAI limit is 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      console.error('[audio/route] ERROR: File too large');
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    // Transcribe audio with timing
    console.log('[audio/route] Starting Whisper transcription...');
    const whisperStartTime = Date.now();
    const text = await transcribeAudio(audioFile);
    const whisperDuration = Date.now() - whisperStartTime;
    console.log(`[audio/route] ✓ Whisper completed in ${whisperDuration}ms (${(whisperDuration / 1000).toFixed(2)}s)`);
    console.log(`[audio/route] Transcribed text length: ${text.length} characters`);
    console.log(`[audio/route] Transcribed text preview: ${text.substring(0, 100)}...`);

    if (!text || text.trim().length === 0) {
      console.error('[audio/route] ERROR: No speech detected in audio');
      return NextResponse.json(
        { error: 'No speech detected in audio' },
        { status: 400 }
      );
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[audio/route] ========== REQUEST COMPLETE ==========`);
    console.log(`[audio/route] Total processing time: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
    console.log(`[audio/route] Breakdown: FormData=${formDataDuration}ms, Whisper=${whisperDuration}ms`);

    return NextResponse.json({ text });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('[audio/route] ========== REQUEST FAILED ==========');
    console.error(`[audio/route] Failed after ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
    console.error('[audio/route] Error details:', error);

    if (error instanceof Error) {
      console.error('[audio/route] Error name:', error.name);
      console.error('[audio/route] Error message:', error.message);
      console.error('[audio/route] Error stack:', error.stack);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to transcribe audio: ${errorMessage}` },
      { status: 500 }
    );
  }
}
