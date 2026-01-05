import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, saveInterviewMessage, getServerSupabase } from '@/lib/supabase';

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

    const message = await saveInterviewMessage(sessionId, {
      role: body.role,
      content: body.content,
      audioUrl: body.audioUrl,
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}
