import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getServerSupabase } from '@/lib/supabase';

export async function POST(
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

    if (!feedbackItems || feedbackItems.length === 0) {
      return NextResponse.json(
        { error: 'No feedback items found for this session' },
        { status: 404 }
      );
    }

    // Aggregate all feedback
    const allStrengths: string[] = [];
    const allWeaknesses: string[] = [];
    const allOpportunities: string[] = [];
    const allThreats: string[] = [];

    let totalCommunicationScore = 0;
    let totalTechnicalScore = 0;
    let totalProblemSolvingScore = 0;
    let totalRelevantExperienceScore = 0;
    let scoreCount = 0;

    feedbackItems.forEach((item) => {
      // Aggregate SWOT items
      if (item.strengths) allStrengths.push(...item.strengths);
      if (item.weaknesses) allWeaknesses.push(...item.weaknesses);
      if (item.opportunities) allOpportunities.push(...item.opportunities);
      if (item.threats) allThreats.push(...item.threats);

      // Sum scores
      if (item.communication_score) {
        totalCommunicationScore += item.communication_score;
        scoreCount++;
      }
      if (item.technical_score) {
        totalTechnicalScore += item.technical_score;
      }
      if (item.problem_solving_score) {
        totalProblemSolvingScore += item.problem_solving_score;
      }
      if (item.relevant_experience_score) {
        totalRelevantExperienceScore += item.relevant_experience_score;
      }
    });

    // Calculate average scores
    const avgCommunicationScore = scoreCount > 0 ? totalCommunicationScore / scoreCount : 0;
    const avgTechnicalScore = scoreCount > 0 ? totalTechnicalScore / scoreCount : 0;
    const avgProblemSolvingScore = scoreCount > 0 ? totalProblemSolvingScore / scoreCount : 0;
    const avgRelevantExperienceScore = scoreCount > 0 ? totalRelevantExperienceScore / scoreCount : 0;

    const overallScore = (
      avgCommunicationScore +
      avgTechnicalScore +
      avgProblemSolvingScore +
      avgRelevantExperienceScore
    ) / 4;

    // Determine verdict based on overall score
    let verdict: 'pass' | 'borderline' | 'fail';
    if (overallScore >= 7) {
      verdict = 'pass';
    } else if (overallScore >= 5) {
      verdict = 'borderline';
    } else {
      verdict = 'fail';
    }

    // Combine threats into deal breakers (major red flags)
    const dealBreakers = allThreats.filter((threat) =>
      threat.toLowerCase().includes('critical') ||
      threat.toLowerCase().includes('major') ||
      threat.toLowerCase().includes('serious') ||
      threat.toLowerCase().includes('significant concern')
    );

    // Create detailed feedback summary
    const detailedFeedback = `
**Overall Performance Summary**

You completed ${feedbackItems.length} interview questions. Here's a comprehensive summary of your performance across all questions:

**Key Strengths Demonstrated:**
${allStrengths.slice(0, 10).map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Areas for Improvement:**
${allWeaknesses.slice(0, 10).map((w, i) => `${i + 1}. ${w}`).join('\n')}

**Growth Opportunities:**
${allOpportunities.slice(0, 8).map((o, i) => `${i + 1}. ${o}`).join('\n')}

${dealBreakers.length > 0 ? `**Critical Concerns:**\n${dealBreakers.map((d, i) => `${i + 1}. ${d}`).join('\n')}` : ''}

**Score Breakdown:**
- Communication: ${avgCommunicationScore.toFixed(1)}/10
- Technical Knowledge: ${avgTechnicalScore.toFixed(1)}/10
- Problem Solving: ${avgProblemSolvingScore.toFixed(1)}/10
- Relevant Experience: ${avgRelevantExperienceScore.toFixed(1)}/10

**Overall Score: ${overallScore.toFixed(1)}/10**
`.trim();

    // Return aggregated evaluation
    const evaluation = {
      verdict,
      overallScore,
      communicationScore: avgCommunicationScore,
      technicalScore: avgTechnicalScore,
      problemSolvingScore: avgProblemSolvingScore,
      relevantExperienceScore: avgRelevantExperienceScore,
      strengths: allStrengths.slice(0, 10), // Top 10 strengths
      weaknesses: allWeaknesses.slice(0, 10), // Top 10 weaknesses
      dealBreakers,
      detailedFeedback,
    };

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error('Error aggregating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to aggregate feedback' },
      { status: 500 }
    );
  }
}
