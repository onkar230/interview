import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { question, industry, role, difficulty, company } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert interviewer and career coach. Generate an ideal/model answer for the following interview question.

QUESTION: "${question}"

CONTEXT:
- Industry: ${industry || 'General'}
- Role: ${role || 'General'}
- Level: ${difficulty || 'mid-level'}
${company ? `- Company: ${company}` : ''}

Provide:
1. **Ideal Answer Structure** - An outline or framework for how to answer (e.g., STAR method, key points to cover)
2. **Model Answer** - A concrete example of a strong answer (2-3 paragraphs max)
3. **Key Points to Include** - Bullet list of must-have elements
4. **Common Mistakes** - What to avoid in this answer
5. **Evaluation Rubric** - What interviewers are looking for

Keep it concise and actionable. Format in markdown.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career coach and interview trainer. Provide clear, actionable guidance.',
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
