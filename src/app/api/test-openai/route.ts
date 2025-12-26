import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';

export async function GET() {
  try {
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not found in environment' },
        { status: 500 }
      );
    }

    // Try to create a client and make a simple request
    const client = getOpenAIClient();

    // Simple test - list models
    const models = await client.models.list();

    return NextResponse.json({
      success: true,
      message: 'OpenAI connection successful',
      modelCount: models.data.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Unknown error',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
