import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await getServerSupabase();

    // Fetch user's interview sessions with evaluations
    const { data: sessions, error } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        interview_evaluations(
          overall_score,
          verdict,
          communication_score,
          technical_score,
          problem_solving_score,
          relevant_experience_score
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
