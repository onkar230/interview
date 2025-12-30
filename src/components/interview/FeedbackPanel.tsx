'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Lightbulb, AlertCircle, Loader2, ChevronDown, ChevronUp, Plus } from 'lucide-react';

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
}

interface FeedbackPanelProps {
  feedbackHistory: FeedbackItem[];
  isAnalyzing: boolean;
}

export default function FeedbackPanel({ feedbackHistory, isAnalyzing }: FeedbackPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="h-full flex flex-col">
      {/* Header - Collapsible on mobile */}
      <div className="bg-white border-b border-gray-200 p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between lg:cursor-default"
        >
          <div className="text-left">
            <h2 className="text-lg font-semibold text-gray-900">Live Feedback</h2>
            <p className="text-sm text-gray-600">Real-time analysis of your answers</p>
          </div>
          <div className="lg:hidden">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </div>
        </button>
      </div>

      {/* Content - Collapsible on mobile */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 ${!isExpanded ? 'hidden lg:block' : ''}`}>
        {isAnalyzing && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-blue-700">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Analyzing your answer...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {feedbackHistory.length === 0 && !isAnalyzing && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Lightbulb className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 text-sm">
              Waiting for your first answer...
              <br />
              <span className="text-xs text-gray-500">
                You'll see feedback here after each response
              </span>
            </p>
          </div>
        )}

        {feedbackHistory.map((feedback, idx) => (
          <Card key={idx} className="shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Question {feedback.questionNumber}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
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
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                      Strengths
                    </span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {feedback.strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-gray-700 list-disc">
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
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                      Areas to Improve
                    </span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {feedback.weaknesses.map((weakness, i) => (
                      <li key={i} className="text-sm text-gray-700 list-disc">
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
                    <Plus className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                      What to Add Next Time
                    </span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {feedback.suggestedImprovements.map((suggestion, i) => (
                      <li key={i} className="text-sm text-gray-700 list-disc">
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
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      Missed Opportunities
                    </span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {feedback.opportunities.map((opportunity, i) => (
                      <li key={i} className="text-sm text-gray-700 list-disc">
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
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                      Red Flags
                    </span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {feedback.threats.map((threat, i) => (
                      <li key={i} className="text-sm text-red-700 list-disc font-medium">
                        {threat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
