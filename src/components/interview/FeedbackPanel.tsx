'use client';

import { useState, useMemo } from 'react';
import { marked } from 'marked';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Lightbulb, AlertCircle, Loader2, ChevronDown, ChevronUp, Plus, GraduationCap } from 'lucide-react';

export interface FeedbackItem {
  questionNumber: number;
  question: string;
  answer: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  suggestedImprovements: string[];
  timestamp: Date;
  idealAnswer?: string;
}

interface FeedbackPanelProps {
  feedbackHistory: FeedbackItem[];
  isAnalyzing: boolean;
}

export default function FeedbackPanel({ feedbackHistory, isAnalyzing }: FeedbackPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Configure marked for safe rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Collapsible on mobile */}
      <div className="flex-shrink-0 bg-card border-b border-border p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between lg:cursor-default"
        >
          <div className="text-left">
            <h2 className="text-sm font-semibold text-card-foreground">Live Feedback</h2>
            <p className="text-xs text-muted-foreground">Real-time analysis of your answers</p>
          </div>
          <div className="lg:hidden">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-card-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-card-foreground" />
            )}
          </div>
        </button>
      </div>

      {/* Content - Collapsible on mobile */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${!isExpanded ? 'hidden lg:block' : ''}`}>
        {isAnalyzing && (
          <Card className="border-accent/30 bg-accent/10 shadow-lg">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Analyzing your answer...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {feedbackHistory.length === 0 && !isAnalyzing && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Lightbulb className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-card-foreground text-sm">
              Waiting for your first answer...
              <br />
              <span className="text-xs text-muted-foreground">
                You'll see feedback here after each response
              </span>
            </p>
          </div>
        )}

        {feedbackHistory.map((feedback, idx) => (
          <Card key={idx} className="shadow-lg bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium text-card-foreground">
                  Question {feedback.questionNumber}
                </CardTitle>
                <Badge variant="outline" className="text-xs border-border">
                  {new Date(feedback.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Strengths */}
              {feedback.strengths.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-700" />
                    <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">
                      Strengths
                    </span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {feedback.strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-card-foreground list-disc">
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {feedback.weaknesses.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                      Areas to Improve
                    </span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {feedback.weaknesses.map((weakness, i) => (
                      <li key={i} className="text-sm text-card-foreground list-disc">
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Improvements */}
              {feedback.suggestedImprovements && feedback.suggestedImprovements.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-secondary" />
                    <span className="text-xs font-semibold text-secondary uppercase tracking-wide">
                      What to Add Next Time
                    </span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {feedback.suggestedImprovements.map((suggestion, i) => (
                      <li key={i} className="text-sm text-card-foreground list-disc">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Opportunities */}
              {feedback.opportunities.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      Missed Opportunities
                    </span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {feedback.opportunities.map((opportunity, i) => (
                      <li key={i} className="text-sm text-card-foreground list-disc">
                        {opportunity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Threats */}
              {feedback.threats.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-700" />
                    <span className="text-xs font-semibold text-red-800 uppercase tracking-wide">
                      Red Flags
                    </span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {feedback.threats.map((threat, i) => (
                      <li key={i} className="text-sm text-red-800 list-disc font-medium">
                        {threat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ideal Answer / Rubric */}
              {feedback.idealAnswer && (
                <div className="space-y-2 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-700" />
                    <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                      Ideal Answer & Rubric
                    </span>
                  </div>
                  <div className="ml-6">
                    <div
                      className="prose prose-sm max-w-none text-sm text-card-foreground leading-relaxed [&>h1]:text-base [&>h1]:font-bold [&>h1]:mt-3 [&>h1]:mb-2 [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mt-2 [&>h2]:mb-1 [&>h3]:text-sm [&>h3]:font-medium [&>h3]:mt-2 [&>h3]:mb-1 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:space-y-1 [&>p]:my-2 [&>strong]:font-semibold [&>em]:italic"
                      dangerouslySetInnerHTML={{ __html: marked(feedback.idealAnswer) as string }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
