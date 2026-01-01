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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/10 mb-4">
              <Lightbulb className="h-8 w-8 text-primary-foreground/60" />
            </div>
            <p className="text-primary-foreground/90 text-sm">
              Waiting for your first answer...
              <br />
              <span className="text-xs text-primary-foreground/60">
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

            <CardContent className="space-y-5">
              {/* Strengths */}
              {feedback.strengths.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-green-900 dark:text-green-400" />
                    <span className="text-sm font-bold text-green-900 dark:text-green-300 uppercase tracking-wide">
                      Strengths
                    </span>
                  </div>
                  <ul className="space-y-2 ml-7">
                    {feedback.strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-foreground list-disc leading-relaxed">
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {feedback.weaknesses.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-amber-900 dark:text-amber-400" />
                    <span className="text-sm font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                      Areas to Improve
                    </span>
                  </div>
                  <ul className="space-y-2 ml-7">
                    {feedback.weaknesses.map((weakness, i) => (
                      <li key={i} className="text-sm text-foreground list-disc leading-relaxed">
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Improvements */}
              {feedback.suggestedImprovements && feedback.suggestedImprovements.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <Plus className="h-5 w-5 text-blue-900 dark:text-blue-400" />
                    <span className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                      What to Add Next Time
                    </span>
                  </div>
                  <ul className="space-y-2 ml-7">
                    {feedback.suggestedImprovements.map((suggestion, i) => (
                      <li key={i} className="text-sm text-foreground list-disc leading-relaxed">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Opportunities */}
              {feedback.opportunities.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <Lightbulb className="h-5 w-5 text-purple-900 dark:text-purple-400" />
                    <span className="text-sm font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wide">
                      Missed Opportunities
                    </span>
                  </div>
                  <ul className="space-y-2 ml-7">
                    {feedback.opportunities.map((opportunity, i) => (
                      <li key={i} className="text-sm text-foreground list-disc leading-relaxed">
                        {opportunity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Threats */}
              {feedback.threats.length > 0 && (
                <div className="space-y-2.5 p-3 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-900 dark:border-red-400 rounded-r">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="h-5 w-5 text-red-900 dark:text-red-400" />
                    <span className="text-sm font-bold text-red-900 dark:text-red-300 uppercase tracking-wide">
                      Red Flags
                    </span>
                  </div>
                  <ul className="space-y-2 ml-7">
                    {feedback.threats.map((threat, i) => (
                      <li key={i} className="text-sm text-red-950 dark:text-red-200 list-disc font-semibold leading-relaxed">
                        {threat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ideal Answer / Rubric */}
              {feedback.idealAnswer && (
                <div className="space-y-2.5 pt-4 border-t-2 border-border">
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="h-5 w-5 text-indigo-900 dark:text-indigo-400" />
                    <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">
                      Ideal Answer & Rubric
                    </span>
                  </div>
                  <div className="ml-7">
                    <div
                      className="prose prose-sm max-w-none text-sm text-foreground leading-relaxed [&>h1]:text-base [&>h1]:font-bold [&>h1]:mt-4 [&>h1]:mb-2 [&>h1]:text-foreground [&>h2]:text-sm [&>h2]:font-bold [&>h2]:mt-3 [&>h2]:mb-2 [&>h2]:text-foreground [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mt-2 [&>h3]:mb-1.5 [&>h3]:text-foreground [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:space-y-2 [&>ul]:text-foreground [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:space-y-2 [&>ol]:text-foreground [&>p]:my-2.5 [&>p]:text-foreground [&>strong]:font-bold [&>strong]:text-foreground [&>em]:italic [&>li]:text-foreground"
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
