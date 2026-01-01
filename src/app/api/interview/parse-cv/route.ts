import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import OpenAI from 'openai';
import { extractText } from 'unpdf';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    let extractedText = '';

    // Get file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse based on file type
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Parse PDF using unpdf (pure JavaScript, no native dependencies)
      // Convert Buffer to Uint8Array as required by unpdf
      const uint8Array = new Uint8Array(buffer);
      const pdfData = await extractText(uint8Array, { mergePages: true });
      extractedText = pdfData.text || '';
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      // Parse DOCX
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (
      fileType === 'application/msword' ||
      fileName.endsWith('.doc')
    ) {
      // Parse DOC (older format - mammoth still works)
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (
      fileType.startsWith('image/') ||
      fileName.match(/\.(jpg|jpeg|png|webp)$/i)
    ) {
      // Parse image using OpenAI Vision
      const base64Image = buffer.toString('base64');
      const mimeType = fileType || 'image/jpeg';

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text from this CV/resume image. Return only the text content, preserving the structure and formatting as much as possible.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      });

      extractedText = response.choices[0].message.content || '';
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, or image files.' },
        { status: 400 }
      );
    }

    // Clean up the text
    extractedText = extractedText.trim();

    if (!extractedText || extractedText.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract meaningful text from the file. Please ensure the CV is readable.' },
        { status: 400 }
      );
    }

    // Limit to ~2000 tokens (roughly 8000 characters) to avoid bloating the prompt
    if (extractedText.length > 8000) {
      extractedText = extractedText.slice(0, 8000) + '... [truncated]';
    }

    return NextResponse.json({
      text: extractedText,
      length: extractedText.length,
      fileName: file.name,
    });
  } catch (error) {
    console.error('Error parsing CV:', error);
    return NextResponse.json(
      { error: 'Failed to parse CV. Please try a different file format.' },
      { status: 500 }
    );
  }
}
