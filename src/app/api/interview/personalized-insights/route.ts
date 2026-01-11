import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getServerSupabase } from '@/lib/supabase';

/**
 * POST /api/interview/personalized-insights
 *
 * Layer 3 of the three-layer feedback structure.
 * This endpoint is called AFTER objective SWOT feedback (Layer 1) and Ideal Answer (Layer 2)
 * have been generated and scores are locked in.
 *
 * It compares current performance against historical averages to provide
 * personalized trend insights without influencing the objective scoring.
 *
 * CRITICAL: This endpoint does NOT participate in scoring.
 * It only provides comparative insights after scores are finalized.
 */

interface CurrentScores {
  communication: number;
  technicalKnowledge: number;
  problemSolving: number;
  relevantExperience: number;
}

interface HistoricalAverages {
  communication: number;
  technicalKnowledge: number;
  problemSolving: number;
  relevantExperience: number;
  overall: number;
  totalInterviews: number;
}

interface TrendInsight {
  category: string;
  currentScore: number;
  historicalAvg: number;
  trend: 'up' | 'down' | 'stable';
  delta: number;
  insight: string;
}

interface RecurringPattern {
  type: 'strength' | 'weakness';
  pattern: string;
  frequency: number;
  totalInterviews: number;
  insight: string;
}

interface PersonalizedInsightsResponse {
  hasHistory: boolean;
  totalHistoricalInterviews: number;
  trendInsights: TrendInsight[];
  recurringPatterns: RecurringPattern[];
  overallProgressMessage: string;
  encouragement: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await getServerSupabase();

    const body = await request.json();
    const { sessionId, questionNumber, currentScores } = body as {
      sessionId: string;
      questionNumber: number;
      currentScores: CurrentScores;
    };

    if (!sessionId || !currentScores) {
      return NextResponse.json(
        { error: 'sessionId and currentScores are required' },
        { status: 400 }
      );
    }

    // Fetch historical data from PREVIOUS interviews (excluding current session)
    const { data: historicalSessions, error: histError } = await supabase
      .from('interview_sessions')
      .select(`
        id,
        industry,
        created_at,
        interview_evaluations (
          overall_score,
          communication_score,
          technical_score,
          problem_solving_score,
          relevant_experience_score,
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
      .neq('id', sessionId) // Exclude current session
      .order('created_at', { ascending: false })
      .limit(20);

    if (histError) {
      console.error('Error fetching historical data:', histError);
      throw histError;
    }

    // If no history, return empty insights
    if (!historicalSessions || historicalSessions.length === 0) {
      return NextResponse.json({
        hasHistory: false,
        totalHistoricalInterviews: 0,
        trendInsights: [],
        recurringPatterns: [],
        overallProgressMessage: 'This is your first completed interview! Keep practicing to see your progress over time.',
        encouragement: 'Great start on your interview preparation journey!',
      } as PersonalizedInsightsResponse);
    }

    // Aggregate historical scores
    const historicalScores = {
      communication: [] as number[],
      technical: [] as number[],
      problemSolving: [] as number[],
      relevantExperience: [] as number[],
      overall: [] as number[],
    };

    const allStrengths: string[] = [];
    const allWeaknesses: string[] = [];

    historicalSessions.forEach((session: any) => {
      // Process evaluations
      if (session.interview_evaluations && session.interview_evaluations.length > 0) {
        const evaluation = session.interview_evaluations[0];

        if (evaluation.communication_score) historicalScores.communication.push(evaluation.communication_score);
        if (evaluation.technical_score) historicalScores.technical.push(evaluation.technical_score);
        if (evaluation.problem_solving_score) historicalScores.problemSolving.push(evaluation.problem_solving_score);
        if (evaluation.relevant_experience_score) historicalScores.relevantExperience.push(evaluation.relevant_experience_score);
        if (evaluation.overall_score) historicalScores.overall.push(evaluation.overall_score);

        if (evaluation.strengths && Array.isArray(evaluation.strengths)) {
          allStrengths.push(...evaluation.strengths);
        }
        if (evaluation.weaknesses && Array.isArray(evaluation.weaknesses)) {
          allWeaknesses.push(...evaluation.weaknesses);
        }
      }

      // Also process individual feedback items
      if (session.interview_feedback_items && Array.isArray(session.interview_feedback_items)) {
        session.interview_feedback_items.forEach((item: any) => {
          if (item.communication_score) historicalScores.communication.push(item.communication_score);
          if (item.technical_score) historicalScores.technical.push(item.technical_score);
          if (item.problem_solving_score) historicalScores.problemSolving.push(item.problem_solving_score);
          if (item.relevant_experience_score) historicalScores.relevantExperience.push(item.relevant_experience_score);

          if (item.strengths && Array.isArray(item.strengths)) {
            allStrengths.push(...item.strengths);
          }
          if (item.weaknesses && Array.isArray(item.weaknesses)) {
            allWeaknesses.push(...item.weaknesses);
          }
        });
      }
    });

    // Calculate historical averages
    const calculateAverage = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const historicalAvg: HistoricalAverages = {
      communication: Math.round(calculateAverage(historicalScores.communication) * 10) / 10,
      technicalKnowledge: Math.round(calculateAverage(historicalScores.technical) * 10) / 10,
      problemSolving: Math.round(calculateAverage(historicalScores.problemSolving) * 10) / 10,
      relevantExperience: Math.round(calculateAverage(historicalScores.relevantExperience) * 10) / 10,
      overall: Math.round(calculateAverage(historicalScores.overall) * 10) / 10,
      totalInterviews: historicalSessions.length,
    };

    // Generate trend insights by comparing current scores to historical averages
    const trendInsights: TrendInsight[] = [];

    const generateTrendInsight = (
      category: string,
      currentScore: number,
      histAvg: number
    ): TrendInsight | null => {
      if (histAvg === 0) return null;

      const delta = Math.round((currentScore - histAvg) * 10) / 10;
      const trend: 'up' | 'down' | 'stable' = delta > 0.5 ? 'up' : delta < -0.5 ? 'down' : 'stable';

      let insight = '';
      if (trend === 'up') {
        insight = `${category}: ${currentScore.toFixed(1)}/10 vs your avg ${histAvg.toFixed(1)}/10 - trending up!`;
      } else if (trend === 'down') {
        insight = `${category}: ${currentScore.toFixed(1)}/10 vs your avg ${histAvg.toFixed(1)}/10 - below your usual performance`;
      } else {
        insight = `${category}: ${currentScore.toFixed(1)}/10 - consistent with your avg ${histAvg.toFixed(1)}/10`;
      }

      return {
        category,
        currentScore,
        historicalAvg: histAvg,
        trend,
        delta,
        insight,
      };
    };

    // Generate insights for each category
    const commInsight = generateTrendInsight('Communication', currentScores.communication, historicalAvg.communication);
    if (commInsight) trendInsights.push(commInsight);

    const techInsight = generateTrendInsight('Technical Knowledge', currentScores.technicalKnowledge, historicalAvg.technicalKnowledge);
    if (techInsight) trendInsights.push(techInsight);

    const psInsight = generateTrendInsight('Problem Solving', currentScores.problemSolving, historicalAvg.problemSolving);
    if (psInsight) trendInsights.push(psInsight);

    const expInsight = generateTrendInsight('Relevant Experience', currentScores.relevantExperience, historicalAvg.relevantExperience);
    if (expInsight) trendInsights.push(expInsight);

    // Find recurring patterns (strengths and weaknesses appearing in 30%+ of interviews)
    const recurringPatterns: RecurringPattern[] = [];
    const minFrequency = Math.ceil(historicalSessions.length * 0.3);

    // Count strength frequencies
    const strengthFreq: Record<string, number> = {};
    allStrengths.forEach(s => {
      const normalized = s.toLowerCase().trim();
      strengthFreq[normalized] = (strengthFreq[normalized] || 0) + 1;
    });

    // Count weakness frequencies
    const weaknessFreq: Record<string, number> = {};
    allWeaknesses.forEach(w => {
      const normalized = w.toLowerCase().trim();
      weaknessFreq[normalized] = (weaknessFreq[normalized] || 0) + 1;
    });

    // Add recurring strengths
    Object.entries(strengthFreq)
      .filter(([_, count]) => count >= minFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([pattern, frequency]) => {
        recurringPatterns.push({
          type: 'strength',
          pattern: pattern.charAt(0).toUpperCase() + pattern.slice(1),
          frequency,
          totalInterviews: historicalSessions.length,
          insight: `"${pattern.charAt(0).toUpperCase() + pattern.slice(1)}" - a consistent strength (${frequency}/${historicalSessions.length} interviews)`,
        });
      });

    // Add recurring weaknesses
    Object.entries(weaknessFreq)
      .filter(([_, count]) => count >= minFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([pattern, frequency]) => {
        recurringPatterns.push({
          type: 'weakness',
          pattern: pattern.charAt(0).toUpperCase() + pattern.slice(1),
          frequency,
          totalInterviews: historicalSessions.length,
          insight: `This is interview #${frequency + 1} where "${pattern}" has been noted - consider focused practice`,
        });
      });

    // Generate overall progress message
    const currentOverall = (
      currentScores.communication +
      currentScores.technicalKnowledge +
      currentScores.problemSolving +
      currentScores.relevantExperience
    ) / 4;

    const overallDelta = currentOverall - historicalAvg.overall;
    let overallProgressMessage = '';

    if (overallDelta > 1) {
      overallProgressMessage = `Excellent performance! Your overall score (${currentOverall.toFixed(1)}/10) is significantly above your historical average (${historicalAvg.overall.toFixed(1)}/10). Your practice is paying off!`;
    } else if (overallDelta > 0.3) {
      overallProgressMessage = `Good progress! You scored ${currentOverall.toFixed(1)}/10, slightly above your average of ${historicalAvg.overall.toFixed(1)}/10.`;
    } else if (overallDelta > -0.3) {
      overallProgressMessage = `Consistent performance at ${currentOverall.toFixed(1)}/10, in line with your historical average of ${historicalAvg.overall.toFixed(1)}/10.`;
    } else if (overallDelta > -1) {
      overallProgressMessage = `Your score of ${currentOverall.toFixed(1)}/10 is slightly below your average of ${historicalAvg.overall.toFixed(1)}/10. Everyone has off days - keep practicing!`;
    } else {
      overallProgressMessage = `This interview scored ${currentOverall.toFixed(1)}/10, below your usual ${historicalAvg.overall.toFixed(1)}/10. Review the feedback and try again - you can do better!`;
    }

    // Generate encouragement based on trends
    const upTrends = trendInsights.filter(t => t.trend === 'up').length;
    const downTrends = trendInsights.filter(t => t.trend === 'down').length;

    let encouragement = '';
    if (upTrends >= 3) {
      encouragement = 'You are showing improvement across multiple areas. Keep up the great work!';
    } else if (upTrends >= 2) {
      encouragement = 'Nice progress in several categories. Your practice is making a difference!';
    } else if (downTrends >= 3) {
      encouragement = 'This was a challenging interview, but every session is a learning opportunity. Review the feedback and come back stronger!';
    } else if (downTrends >= 2) {
      encouragement = 'A few areas dipped this time. Focus on the suggested improvements and you will bounce back!';
    } else {
      encouragement = 'Steady performance! Consider pushing yourself with harder questions to reach the next level.';
    }

    const response: PersonalizedInsightsResponse = {
      hasHistory: true,
      totalHistoricalInterviews: historicalSessions.length,
      trendInsights,
      recurringPatterns,
      overallProgressMessage,
      encouragement,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating personalized insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate personalized insights' },
      { status: 500 }
    );
  }
}
