'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

interface Evaluation {
  verdict: 'pass' | 'borderline' | 'fail';
  strengths: string[];
  weaknesses: string[];
  dealBreakers: string[];
  detailedFeedback: string;
}

export default function EvaluationPage() {
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Retrieve evaluation from sessionStorage
    const storedEvaluation = sessionStorage.getItem('interviewEvaluation');

    if (storedEvaluation) {
      try {
        const parsed = JSON.parse(storedEvaluation);
        setEvaluation(parsed);
      } catch (err) {
        console.error('Error parsing evaluation:', err);
      }
    }

    setIsLoading(false);
  }, []);

  const handleStartNewInterview = () => {
    sessionStorage.removeItem('interviewEvaluation');
    router.push('/interview/select');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading evaluation...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">No evaluation found</p>
          <Button onClick={() => router.push('/interview/select')}>
            Start New Interview
          </Button>
        </div>
      </div>
    );
  }

  const verdictConfig = {
    pass: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      title: 'Strong Hire',
      description: 'You performed excellently in this interview!',
    },
    borderline: {
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      title: 'Borderline',
      description: 'You showed potential but there are some areas to improve.',
    },
    fail: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      title: 'Not Recommended',
      description: 'There were significant concerns with this interview.',
    },
  };

  const config = verdictConfig[evaluation.verdict];
  const VerdictIcon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Verdict Header */}
        <div className={`rounded-2xl p-8 mb-8 border-2 ${config.bgColor} ${config.borderColor}`}>
          <div className="flex items-center gap-4 mb-4">
            <VerdictIcon className={`h-12 w-12 ${config.color}`} />
            <div>
              <h1 className={`text-3xl font-bold ${config.color}`}>{config.title}</h1>
              <p className="text-gray-700 mt-1">{config.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          {evaluation.strengths.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Strengths</h2>
              </div>
              <ul className="space-y-3">
                {evaluation.strengths.map((strength, idx) => (
                  <li key={idx} className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {evaluation.weaknesses.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-yellow-100">
              <div className="flex items-center gap-3 mb-4">
                <TrendingDown className="h-6 w-6 text-yellow-600" />
                <h2 className="text-xl font-semibold text-gray-900">Areas for Improvement</h2>
              </div>
              <ul className="space-y-3">
                {evaluation.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Deal Breakers */}
        {evaluation.dealBreakers.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-2 border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">Critical Issues</h2>
            </div>
            <ul className="space-y-3">
              {evaluation.dealBreakers.map((dealBreaker, idx) => (
                <li key={idx} className="flex gap-2">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium">{dealBreaker}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Feedback */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Feedback</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {evaluation.detailedFeedback}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleStartNewInterview}
            className="px-8"
          >
            Start New Interview
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/')}
            className="px-8"
          >
            Back to Home
          </Button>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Review the feedback and work on your weak areas</li>
            <li>Practice more interviews to build confidence</li>
            <li>Research common interview questions for your industry</li>
            <li>Prepare specific examples from your experience</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
