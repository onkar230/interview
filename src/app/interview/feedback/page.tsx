'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from 'lucide-react';

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

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeedback = async () => {
      if (!sessionId) {
        console.error('No sessionId provided');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/interview/sessions/${sessionId}/feedback`);

        if (!response.ok) {
          throw new Error('Failed to load feedback');
        }

        const data = await response.json();
        setFeedbackItems(data.feedbackItems || []);
      } catch (err) {
        console.error('Error loading feedback:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeedback();
  }, [sessionId]);

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
            Review the detailed SWOT feedback for each question from your interview
          </p>
        </div>

        {/* Feedback Items */}
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

              {/* SWOT Grid */}
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
            </div>
          ))}
        </div>
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
