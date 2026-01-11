import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getServerSupabase } from '@/lib/supabase';

/**
 * GET /api/interview/personalization-context
 * Fetches and aggregates user's interview history for personalized coaching
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await getServerSupabase();

    // Fetch all completed sessions with their feedback and evaluations
    const { data: sessions, error: sessionsError } = await supabase
      .from('interview_sessions')
      .select(`
        id,
        industry,
        role,
        company,
        difficulty,
        question_types,
        created_at,
        interview_feedback_items (
          question_number,
          strengths,
          weaknesses,
          opportunities,
          threats,
          communication_score,
          technical_score,
          problem_solving_score,
          relevant_experience_score
        ),
        interview_evaluations (
          overall_score,
          communication_score,
          technical_score,
          problem_solving_score,
          relevant_experience_score,
          strengths,
          weaknesses
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (sessionsError) throw sessionsError;

    // If no history, return empty state
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        hasHistory: false,
        totalInterviews: 0,
        relevanceScore: 0,
        universalData: null,
        questionTypeData: {},
        industryData: {},
        strengths: [],
        focusAreas: [],
        trend: 'none',
      });
    }

    // Aggregate universal scores across all interviews
    const universalScores = {
      communication: [] as number[],
      technical: [] as number[],
      problemSolving: [] as number[],
      relevantExperience: [] as number[],
      overall: [] as number[],
    };

    sessions.forEach((session: any) => {
      const evaluation = session.interview_evaluations?.[0];
      if (evaluation) {
        if (evaluation.communication_score) universalScores.communication.push(evaluation.communication_score);
        if (evaluation.technical_score) universalScores.technical.push(evaluation.technical_score);
        if (evaluation.problem_solving_score) universalScores.problemSolving.push(evaluation.problem_solving_score);
        if (evaluation.relevant_experience_score) universalScores.relevantExperience.push(evaluation.relevant_experience_score);
        if (evaluation.overall_score) universalScores.overall.push(evaluation.overall_score);
      }
    });

    const calculateAverage = (scores: number[]) =>
      scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;

    const universalData = {
      communicationAvg: calculateAverage(universalScores.communication),
      technicalAvg: calculateAverage(universalScores.technical),
      problemSolvingAvg: calculateAverage(universalScores.problemSolving),
      relevantExperienceAvg: calculateAverage(universalScores.relevantExperience),
      overallAvg: calculateAverage(universalScores.overall),
      interviewCount: sessions.length,
    };

    // Aggregate by question type
    const questionTypeData: Record<string, { count: number; averageScore: number }> = {};
    sessions.forEach((session: any) => {
      const questionTypes = session.question_types || [];
      const evaluation = session.interview_evaluations?.[0];
      const overallScore = evaluation?.overall_score || 0;

      questionTypes.forEach((type: string) => {
        if (!questionTypeData[type]) {
          questionTypeData[type] = { count: 0, averageScore: 0 };
        }
        questionTypeData[type].count += 1;
        questionTypeData[type].averageScore += overallScore;
      });
    });

    // Calculate averages for question types
    Object.keys(questionTypeData).forEach((type) => {
      questionTypeData[type].averageScore /= questionTypeData[type].count;
    });

    // Aggregate by industry
    const industryData: Record<string, { count: number; averageScore: number }> = {};
    sessions.forEach((session: any) => {
      const industry = session.industry;
      const evaluation = session.interview_evaluations?.[0];
      const overallScore = evaluation?.overall_score || 0;

      if (!industryData[industry]) {
        industryData[industry] = { count: 0, averageScore: 0 };
      }
      industryData[industry].count += 1;
      industryData[industry].averageScore += overallScore;
    });

    // Calculate averages for industries
    Object.keys(industryData).forEach((industry) => {
      industryData[industry].averageScore /= industryData[industry].count;
    });

    // Extract top strengths across all sessions
    const allStrengths: string[] = [];
    sessions.forEach((session: any) => {
      const evaluation = session.interview_evaluations?.[0];
      if (evaluation?.strengths) {
        allStrengths.push(...evaluation.strengths);
      }
    });

    // Count frequency of each strength
    const strengthCounts: Record<string, number> = {};
    allStrengths.forEach((strength) => {
      strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
    });

    // Get top 3 most frequent strengths
    const topStrengths = Object.entries(strengthCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([strength]) => strength);

    // Extract top weaknesses/focus areas
    const allWeaknesses: string[] = [];
    sessions.forEach((session: any) => {
      const evaluation = session.interview_evaluations?.[0];
      if (evaluation?.weaknesses) {
        allWeaknesses.push(...evaluation.weaknesses);
      }
    });

    const weaknessCounts: Record<string, number> = {};
    allWeaknesses.forEach((weakness) => {
      weaknessCounts[weakness] = (weaknessCounts[weakness] || 0) + 1;
    });

    const topFocusAreas = Object.entries(weaknessCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([weakness]) => weakness);

    // Determine trend (comparing first half vs second half of sessions)
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (sessions.length >= 4) {
      const midpoint = Math.floor(sessions.length / 2);
      const firstHalf = sessions.slice(midpoint);
      const secondHalf = sessions.slice(0, midpoint);

      const firstHalfAvg =
        firstHalf.reduce((sum: number, s: any) => {
          return sum + (s.interview_evaluations?.[0]?.overall_score || 0);
        }, 0) / firstHalf.length;

      const secondHalfAvg =
        secondHalf.reduce((sum: number, s: any) => {
          return sum + (s.interview_evaluations?.[0]?.overall_score || 0);
        }, 0) / secondHalf.length;

      const diff = secondHalfAvg - firstHalfAvg;
      if (diff > 0.5) trend = 'improving';
      else if (diff < -0.5) trend = 'declining';
    }

    return NextResponse.json({
      hasHistory: true,
      totalInterviews: sessions.length,
      universalData,
      questionTypeData,
      industryData,
      strengths: topStrengths,
      focusAreas: topFocusAreas,
      trend,
    });
  } catch (error) {
    console.error('Error fetching personalization context:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personalization context' },
      { status: 500 }
    );
  }
}
