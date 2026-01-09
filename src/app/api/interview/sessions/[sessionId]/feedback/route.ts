import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, saveFeedbackItem, getServerSupabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { sessionId } = await params;

    // Verify session ownership
    const supabase = await getServerSupabase();
    const { data: session } = await supabase
      .from('interview_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (!session || session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const feedback = await saveFeedbackItem(sessionId, {
      questionNumber: body.questionNumber,
      question: body.question,
      answer: body.answer,
      strengths: body.strengths,
      weaknesses: body.weaknesses,
      opportunities: body.opportunities,
      threats: body.threats,
      suggestedImprovements: body.suggestedImprovements,
      idealAnswer: body.idealAnswer,
      scores: body.scores,
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await requireAuth();
    const { sessionId } = await params;

    const supabase = await getServerSupabase();

    // Verify session ownership
    const { data: session } = await supabase
      .from('interview_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (!session || session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all feedback items for this session
    const { data: feedbackItems, error } = await supabase
      .from('interview_feedback_items')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_number', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ feedbackItems: feedbackItems || [] });
  } catch (error) {
    console.error('Error fetching feedback items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback items' },
      { status: 500 }
    );
  }
}
