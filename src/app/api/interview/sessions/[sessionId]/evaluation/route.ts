import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, saveEvaluation, getServerSupabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { sessionId } = await params;

    const supabase = await getServerSupabase();
    const { data: session } = await supabase
      .from('interview_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (!session || session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const evaluation = await saveEvaluation(sessionId, {
      verdict: body.verdict,
      overallScore: body.overallScore,
      communicationScore: body.communicationScore,
      technicalScore: body.technicalScore,
      problemSolvingScore: body.problemSolvingScore,
      relevantExperienceScore: body.relevantExperienceScore,
      strengths: body.strengths,
      weaknesses: body.weaknesses,
      dealBreakers: body.dealBreakers,
      detailedFeedback: body.detailedFeedback,
    });

    // Update session status to completed
    await supabase
      .from('interview_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error('Error saving evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to save evaluation' },
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
    const { data: evaluation, error } = await supabase
      .from('interview_evaluations')
      .select('*, interview_sessions!inner(user_id)')
      .eq('session_id', sessionId)
      .single();

    if (error) throw error;

    // Verify ownership
    if (evaluation.interview_sessions.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluation' },
      { status: 500 }
    );
  }
}
