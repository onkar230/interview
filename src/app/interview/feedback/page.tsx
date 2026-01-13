'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Sparkles,
  CheckCircle,
  XCircle,
  Minus,
  Trophy,
  Target,
} from 'lucide-react';

interface FeedbackItem {
  id: string;
  question_number: number;
  question: string;
  answer: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  suggested_improvements: string[];
  ideal_answer: string | null;
  communication_score: number | null;
  technical_score: number | null;
  problem_solving_score: number | null;
  relevant_experience_score: number | null;
}

interface SessionData {
  id: string;
  use_personalization: boolean;
  industry: string;
  company: string;
  role: string;
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

interface PersonalizedInsights {
  hasHistory: boolean;
  totalHistoricalInterviews: number;
  trendInsights: TrendInsight[];
  recurringPatterns: RecurringPattern[];
  overallProgressMessage: string;
  encouragement: string;
}

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Personalized Insights state (Layer 3)
  const [personalizedInsights, setPersonalizedInsights] = useState<PersonalizedInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Helper function to clean markdown from ideal answer
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/^#{1,6}\s+/gm, '') // Remove markdown headings (## )
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold (**text**)
      .replace(/\*(.+?)\*/g, '$1') // Remove italic (*text*)
      .replace(/^\s*[-*+]\s+/gm, '• ') // Convert markdown lists to bullet points
      .trim();
  };

  // Load feedback and session data
  useEffect(() => {
    const loadFeedback = async () => {
      if (!sessionId) {
        console.error('No sessionId provided');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch feedback items
        const response = await fetch(`/api/interview/sessions/${sessionId}/feedback`);

        if (!response.ok) {
          throw new Error('Failed to load feedback');
        }

        const data = await response.json();
        setFeedbackItems(data.feedbackItems || []);

        // Also fetch session data to check personalization setting
        const sessionResponse = await fetch(`/api/interview/sessions/${sessionId}`);
        if (sessionResponse.ok) {
          const sessionResult = await sessionResponse.json();
          setSessionData(sessionResult.session);
        }
      } catch (err) {
        console.error('Error loading feedback:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeedback();
  }, [sessionId]);

  // Fetch personalized insights AFTER objective feedback is loaded (Layer 3)
  // This ensures no anchoring bias - insights are fetched separately
  useEffect(() => {
    const fetchPersonalizedInsights = async () => {
      // Only fetch if:
      // 1. We have session data
      // 2. Personalization was enabled for this session
      // 3. We have feedback items with scores
      // 4. We haven't already loaded insights
      if (
        !sessionData ||
        !sessionData.use_personalization ||
        feedbackItems.length === 0 ||
        personalizedInsights
      ) {
        return;
      }

      // Calculate average scores from feedback items for comparison
      const validItems = feedbackItems.filter(
        item =>
          item.communication_score !== null ||
          item.technical_score !== null ||
          item.problem_solving_score !== null ||
          item.relevant_experience_score !== null
      );

      if (validItems.length === 0) return;

      const avgScores = {
        communication:
          validItems.reduce((sum, item) => sum + (item.communication_score || 0), 0) / validItems.length,
        technicalKnowledge:
          validItems.reduce((sum, item) => sum + (item.technical_score || 0), 0) / validItems.length,
        problemSolving:
          validItems.reduce((sum, item) => sum + (item.problem_solving_score || 0), 0) / validItems.length,
        relevantExperience:
          validItems.reduce((sum, item) => sum + (item.relevant_experience_score || 0), 0) / validItems.length,
      };

      setIsLoadingInsights(true);

      try {
        const response = await fetch('/api/interview/personalized-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            questionNumber: feedbackItems.length,
            currentScores: avgScores,
          }),
        });

        if (response.ok) {
          const insights = await response.json();
          setPersonalizedInsights(insights);
        }
      } catch (err) {
        console.error('Error fetching personalized insights:', err);
      } finally {
        setIsLoadingInsights(false);
      }
    };

    fetchPersonalizedInsights();
  }, [sessionData, feedbackItems, sessionId, personalizedInsights]);

  // Helper to render trend icon
  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading feedback...</p>
        </div>
      </div>
    );
  }

  if (feedbackItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">No feedback found for this session</p>
          <Button onClick={() => router.push('/interview/select')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/interview/select')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Interview Feedback</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Review the detailed feedback for each question from your interview
          </p>
        </div>

        {/* Feedback Items - Layer 1 & 2: Objective SWOT + Ideal Answer */}
        <div className="space-y-6">
          {feedbackItems.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-lg p-6">
              {/* Question Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Question {item.question_number}
                  </h3>
                  {(item.communication_score || item.technical_score || item.problem_solving_score || item.relevant_experience_score) && (
                    <div className="flex gap-4 text-sm">
                      {item.communication_score && (
                        <span className="text-muted-foreground">
                          Communication: <span className="font-semibold text-foreground">{item.communication_score.toFixed(1)}/10</span>
                        </span>
                      )}
                      {item.technical_score && (
                        <span className="text-muted-foreground">
                          Technical: <span className="font-semibold text-foreground">{item.technical_score.toFixed(1)}/10</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-foreground font-medium mb-3">{item.question}</p>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground italic">&quot;{item.answer}&quot;</p>
                </div>
              </div>

              {/* SWOT Grid - Layer 1: Objective Feedback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                {item.strengths && item.strengths.length > 0 && (
                  <div className="bg-green-50/50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-5 w-5 text-green-700" />
                      <h4 className="font-semibold text-green-900">Strengths</h4>
                    </div>
                    <ul className="space-y-2">
                      {item.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {item.weaknesses && item.weaknesses.length > 0 && (
                  <div className="bg-red-50/50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="h-5 w-5 text-red-700" />
                      <h4 className="font-semibold text-red-900">Weaknesses</h4>
                    </div>
                    <ul className="space-y-2">
                      {item.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                          <span className="text-red-600 mt-1">•</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Opportunities */}
                {item.opportunities && item.opportunities.length > 0 && (
                  <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="h-5 w-5 text-blue-700" />
                      <h4 className="font-semibold text-blue-900">Opportunities</h4>
                    </div>
                    <ul className="space-y-2">
                      {item.opportunities.map((opportunity, idx) => (
                        <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Threats */}
                {item.threats && item.threats.length > 0 && (
                  <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-amber-700" />
                      <h4 className="font-semibold text-amber-900">Threats</h4>
                    </div>
                    <ul className="space-y-2">
                      {item.threats.map((threat, idx) => (
                        <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                          <span className="text-amber-600 mt-1">•</span>
                          <span>{threat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Suggested Improvements */}
              {item.suggested_improvements && item.suggested_improvements.length > 0 && (
                <div className="mt-4 bg-purple-50/50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3">Suggested Improvements</h4>
                  <ul className="space-y-2">
                    {item.suggested_improvements.map((improvement, idx) => (
                      <li key={idx} className="text-sm text-purple-800 flex items-start gap-2">
                        <span className="text-purple-600 mt-1">→</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Layer 2: Ideal Answer */}
              {item.ideal_answer && (
                <div className="mt-4 bg-secondary/30 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-foreground">Ideal Answer</h4>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cleanMarkdown(item.ideal_answer)}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Layer 3: Personalized Insights Section */}
        {sessionData?.use_personalization && (
          <div className="mt-12">
            <div className="border-t border-border pt-8">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    Personalized Insights
                    <Sparkles className="h-5 w-5 text-accent" />
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    How this interview compares to your historical performance
                  </p>
                </div>
              </div>

              {isLoadingInsights ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-3"></div>
                  <p className="text-muted-foreground text-sm">Analysing your performance history...</p>
                </div>
              ) : personalizedInsights?.hasHistory ? (
                <div className="space-y-6">
                  {/* Overall Progress Card */}
                  <div className="bg-primary rounded-xl p-6 text-primary-foreground">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Trophy className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">{personalizedInsights.overallProgressMessage}</p>
                        <p className="text-sm text-primary-foreground/70">
                          Based on {personalizedInsights.totalHistoricalInterviews} previous interview{personalizedInsights.totalHistoricalInterviews !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trend Insights Grid */}
                  {personalizedInsights.trendInsights.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Score Trends vs Historical Average
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {personalizedInsights.trendInsights.map((insight, idx) => (
                          <div
                            key={idx}
                            className={`rounded-lg p-4 ${
                              insight.trend === 'up'
                                ? 'bg-green-50/50 border border-green-200'
                                : insight.trend === 'down'
                                ? 'bg-red-50/50 border border-red-200'
                                : 'bg-muted/30 border border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-foreground">{insight.category}</span>
                              <TrendIcon trend={insight.trend} />
                            </div>
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-2xl font-bold text-foreground">
                                {insight.currentScore.toFixed(1)}
                              </span>
                              <span className="text-sm text-muted-foreground">/10</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                vs avg {insight.historicalAvg.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {insight.delta > 0 ? '+' : ''}{insight.delta.toFixed(1)} from average
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recurring Patterns */}
                  {personalizedInsights.recurringPatterns.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Recurring Patterns Across Your Interviews
                      </h3>
                      <div className="space-y-3">
                        {personalizedInsights.recurringPatterns.map((pattern, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-3 p-3 rounded-lg ${
                              pattern.type === 'strength'
                                ? 'bg-green-50/50 border border-green-200'
                                : 'bg-amber-50/50 border border-amber-200'
                            }`}
                          >
                            {pattern.type === 'strength' ? (
                              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className={`text-sm font-medium ${
                                pattern.type === 'strength' ? 'text-green-900' : 'text-amber-900'
                              }`}>
                                {pattern.insight}
                              </p>
                              <p className={`text-xs mt-1 ${
                                pattern.type === 'strength' ? 'text-green-700' : 'text-amber-700'
                              }`}>
                                {pattern.type === 'strength' ? 'Consistent strength' : 'Area for focused improvement'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Encouragement */}
                  <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 text-center">
                    <Sparkles className="h-8 w-8 text-accent mx-auto mb-3" />
                    <p className="text-foreground font-medium">{personalizedInsights.encouragement}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Building Your Profile</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    This is your first interview with personalized insights enabled.
                    Complete more interviews to see how your performance trends over time!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading feedback...</p>
        </div>
      </div>
    }>
      <FeedbackContent />
    </Suspense>
  );
}
