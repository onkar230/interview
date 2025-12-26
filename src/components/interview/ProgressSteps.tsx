'use client';

import { CheckCircle } from 'lucide-react';

interface ProgressStepsProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { number: 1, label: 'Industry' },
  { number: 2, label: 'Details' },
  { number: 3, label: 'Interview' },
];

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isUpcoming = currentStep < step.number;

          return (
            <div key={step.number} className="flex flex-col items-center flex-1">
              {/* Circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all duration-300 relative z-10
                  ${isCompleted ? 'bg-blue-600 text-white' : ''}
                  ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' : ''}
                  ${isUpcoming ? 'bg-white border-2 border-gray-300 text-gray-400' : ''}
                `}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>

              {/* Label */}
              <div
                className={`
                  mt-2 text-sm font-medium text-center
                  ${isCurrent ? 'text-blue-600' : ''}
                  ${isCompleted ? 'text-gray-700' : ''}
                  ${isUpcoming ? 'text-gray-400' : ''}
                `}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
