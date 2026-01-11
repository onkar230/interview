import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getServerSupabase } from '@/lib/supabase';

/**
 * Personalization Context API
 *
 * Fetches aggregated feedback from previous interviews to provide
 * personalized coaching context for new interview sessions.
 */

interface PersonalizationContext {
  hasHistory: boolean;
  totalInterviews: number;
  averageScores: {
    communication: number;
    technicalKnowledge: number;
    problemSolving: number;
    relevantExperience: number;
    overall: number;
  };
  consistentStrengths: string[];
  areasForImprovement: string[];
  improvementTrend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  recentVerdicts: string[];
  industryExperience: Record<string, number>;
  questionTypeExperience: Record<string, number>;
}

/**
 * GET /api/interview/personalization
 * Fetches personalization context for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await getServerSupabase();

    // Fetch all completed sessions with their feedback for this user
    const { data: sessions, error: sessionsError } = await supabase
      .from('interview_sessions')
      .select(`
        id,
        industry,
        question_types,
        status,
        created_at,
        interview_evaluations (
          overall_score,
          communication_score,
          technical_score,
          problem_solving_score,
          relevant_experience_score,
          verdict,
          strengths,
          weaknesses
        ),
        interview_feedback_items (
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
      .order('created_at', { ascending: false })
      .limit(20); // Last 20 completed interviews

    if (sessionsError) {
      console.error('Error fetching sessions for personalization:', sessionsError);
      throw sessionsError;
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        hasHistory: false,
        totalInterviews: 0,
        averageScores: {
          communication: 0,
          technicalKnowledge: 0,
          problemSolving: 0,
          relevantExperience: 0,
          overall: 0,
        },
        consistentStrengths: [],
        areasForImprovement: [],
        improvementTrend: 'insufficient_data',
        recentVerdicts: [],
        industryExperience: {},
        questionTypeExperience: {},
      } as PersonalizationContext);
    }

    // Aggregate scores from evaluations
    const scores = {
      communication: [] as number[],
      technical: [] as number[],
      problemSolving: [] as number[],
      relevantExperience: [] as number[],
      overall: [] as number[],
    };

    const allStrengths: string[] = [];
    const allWeaknesses: string[] = [];
    const verdicts: string[] = [];
    const industryCount: Record<string, number> = {};
    const questionTypeCount: Record<string, number> = {};

    sessions.forEach((session: any) => {
      // Count industry experience
      if (session.industry) {
        industryCount[session.industry] = (industryCount[session.industry] || 0) + 1;
      }

      // Count question type experience
      if (session.question_types && Array.isArray(session.question_types)) {
        session.question_types.forEach((qType: string) => {
          questionTypeCount[qType] = (questionTypeCount[qType] || 0) + 1;
        });
      }

      // Process evaluations
      if (session.interview_evaluations && session.interview_evaluations.length > 0) {
        const evaluation = session.interview_evaluations[0];

        if (evaluation.communication_score) scores.communication.push(evaluation.communication_score);
        if (evaluation.technical_score) scores.technical.push(evaluation.technical_score);
        if (evaluation.problem_solving_score) scores.problemSolving.push(evaluation.problem_solving_score);
        if (evaluation.relevant_experience_score) scores.relevantExperience.push(evaluation.relevant_experience_score);
        if (evaluation.overall_score) scores.overall.push(evaluation.overall_score);
        if (evaluation.verdict) verdicts.push(evaluation.verdict);

        if (evaluation.strengths && Array.isArray(evaluation.strengths)) {
          allStrengths.push(...evaluation.strengths);
        }
        if (evaluation.weaknesses && Array.isArray(evaluation.weaknesses)) {
          allWeaknesses.push(...evaluation.weaknesses);
        }
      }

      // Also process individual feedback items for more granular data
      if (session.interview_feedback_items && Array.isArray(session.interview_feedback_items)) {
        session.interview_feedback_items.forEach((item: any) => {
          if (item.communication_score) scores.communication.push(item.communication_score);
          if (item.technical_score) scores.technical.push(item.technical_score);
          if (item.problem_solving_score) scores.problemSolving.push(item.problem_solving_score);
          if (item.relevant_experience_score) scores.relevantExperience.push(item.relevant_experience_score);

          if (item.strengths && Array.isArray(item.strengths)) {
            allStrengths.push(...item.strengths);
          }
          if (item.weaknesses && Array.isArray(item.weaknesses)) {
            allWeaknesses.push(...item.weaknesses);
          }
        });
      }
    });

    // Calculate averages
    const calculateAverage = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const averageScores = {
      communication: Math.round(calculateAverage(scores.communication) * 10) / 10,
      technicalKnowledge: Math.round(calculateAverage(scores.technical) * 10) / 10,
      problemSolving: Math.round(calculateAverage(scores.problemSolving) * 10) / 10,
      relevantExperience: Math.round(calculateAverage(scores.relevantExperience) * 10) / 10,
      overall: Math.round(calculateAverage(scores.overall) * 10) / 10,
    };

    // Find consistent strengths (appearing in 30%+ of sessions)
    const strengthFrequency: Record<string, number> = {};
    allStrengths.forEach(s => {
      const normalized = s.toLowerCase().trim();
      strengthFrequency[normalized] = (strengthFrequency[normalized] || 0) + 1;
    });

    const consistentStrengths = Object.entries(strengthFrequency)
      .filter(([_, count]) => count >= Math.ceil(sessions.length * 0.3))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([strength]) => strength.charAt(0).toUpperCase() + strength.slice(1));

    // Find areas for improvement (appearing in 30%+ of sessions)
    const weaknessFrequency: Record<string, number> = {};
    allWeaknesses.forEach(w => {
      const normalized = w.toLowerCase().trim();
      weaknessFrequency[normalized] = (weaknessFrequency[normalized] || 0) + 1;
    });

    const areasForImprovement = Object.entries(weaknessFrequency)
      .filter(([_, count]) => count >= Math.ceil(sessions.length * 0.3))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([weakness]) => weakness.charAt(0).toUpperCase() + weakness.slice(1));

    // Calculate improvement trend based on overall scores
    let improvementTrend: 'improving' | 'declining' | 'stable' | 'insufficient_data' = 'insufficient_data';

    if (scores.overall.length >= 3) {
      // Compare first half vs second half of scores (most recent vs older)
      const midpoint = Math.floor(scores.overall.length / 2);
      const recentScores = scores.overall.slice(0, midpoint);
      const olderScores = scores.overall.slice(midpoint);

      const recentAvg = calculateAverage(recentScores);
      const olderAvg = calculateAverage(olderScores);

      const diff = recentAvg - olderAvg;

      if (diff > 0.5) {
        improvementTrend = 'improving';
      } else if (diff < -0.5) {
        improvementTrend = 'declining';
      } else {
        improvementTrend = 'stable';
      }
    }

    const personalizationContext: PersonalizationContext = {
      hasHistory: true,
      totalInterviews: sessions.length,
      averageScores,
      consistentStrengths,
      areasForImprovement,
      improvementTrend,
      recentVerdicts: verdicts.slice(0, 5),
      industryExperience: industryCount,
      questionTypeExperience: questionTypeCount,
    };

    return NextResponse.json(personalizationContext);
  } catch (error) {
    console.error('Error fetching personalization context:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personalization context' },
      { status: 500 }
    );
  }
}
