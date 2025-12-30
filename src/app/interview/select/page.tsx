'use client';

import { useRouter } from 'next/navigation';
import {
  Code,
  DollarSign,
  Heart,
  Megaphone,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Wrench,
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Industry, INDUSTRY_PROMPTS } from '@/lib/interview-prompts';
import ProgressSteps from '@/components/interview/ProgressSteps';

const INDUSTRY_ICONS = {
  technology: Code,
  finance: DollarSign,
  healthcare: Heart,
  marketing: Megaphone,
  sales: TrendingUp,
  consulting: Briefcase,
  education: GraduationCap,
  engineering: Wrench,
  law: Scale,
};

export default function SelectIndustryPage() {
  const router = useRouter();

  // Focus on high-ROI industries for students/entry-level candidates
  const AVAILABLE_INDUSTRIES: Industry[] = ['technology', 'engineering', 'finance', 'law'];

  const handleIndustrySelect = (industry: Industry) => {
    router.push(`/interview/configure?industry=${industry}`);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Progress Steps */}
        <ProgressSteps currentStep={1} />

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Select Your Industry
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose the industry that matches your career goals. We'll tailor the interview accordingly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AVAILABLE_INDUSTRIES.map((industry) => {
            const config = INDUSTRY_PROMPTS[industry];
            const Icon = INDUSTRY_ICONS[industry];

            return (
              <button
                key={industry}
                onClick={() => handleIndustrySelect(industry)}
                className="bg-card border border-border rounded-xl p-6 shadow-md hover:shadow-xl hover:shadow-primary/10 transition-all duration-200 hover:scale-105 text-left group"
              >
                <div className="flex items-start gap-4 mb-3">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-card-foreground mb-2 capitalize">
                  {industry}
                </h3>

                <p className="text-sm text-muted-foreground mb-4">
                  {config.description}
                </p>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Focus Areas:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {config.focusAreas.slice(0, 3).map((area, idx) => (
                      <li key={idx}>{area}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-primary group-hover:text-secondary">
                    Start Interview
                  </span>
                  <svg
                    className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
