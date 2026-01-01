'use client';

interface PerformanceScoreProps {
  overallScore: number;
  categoryScores: {
    communication: number;
    technicalKnowledge: number;
    problemSolving: number;
    relevantExperience: number;
  };
  answersCount: number;
}

export default function PerformanceScore({ overallScore, categoryScores, answersCount }: PerformanceScoreProps) {
  // Calculate color based on score
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-600';
    if (score >= 50) return 'bg-amber-600';
    return 'bg-red-600';
  };

  if (answersCount === 0) {
    return null; // Don't show score until at least one answer
  }

  return (
    <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-4 max-w-2xl">
      <div className="flex items-center justify-between gap-6">
        {/* Left side: Category breakdowns */}
        <div className="flex-1 space-y-3">
          {/* Communication */}
          <div className="flex items-center gap-3">
            <div className="w-32 text-xs font-medium text-card-foreground">Communication</div>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getBarColor(categoryScores.communication)}`}
                style={{ width: `${categoryScores.communication}%` }}
              />
            </div>
            <div className="w-12 text-xs text-right text-muted-foreground">
              {Math.round(categoryScores.communication)}/100
            </div>
          </div>

          {/* Technical Knowledge */}
          <div className="flex items-center gap-3">
            <div className="w-32 text-xs font-medium text-card-foreground">Technical Skills</div>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getBarColor(categoryScores.technicalKnowledge)}`}
                style={{ width: `${categoryScores.technicalKnowledge}%` }}
              />
            </div>
            <div className="w-12 text-xs text-right text-muted-foreground">
              {Math.round(categoryScores.technicalKnowledge)}/100
            </div>
          </div>

          {/* Problem Solving */}
          <div className="flex items-center gap-3">
            <div className="w-32 text-xs font-medium text-card-foreground">Problem Solving</div>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getBarColor(categoryScores.problemSolving)}`}
                style={{ width: `${categoryScores.problemSolving}%` }}
              />
            </div>
            <div className="w-12 text-xs text-right text-muted-foreground">
              {Math.round(categoryScores.problemSolving)}/100
            </div>
          </div>
        </div>

        {/* Right side: Overall score */}
        <div className="flex flex-col items-center justify-center px-6 border-l border-border">
          <div className={`text-5xl font-bold ${getScoreColor(overallScore)} transition-all duration-500`}>
            {Math.round(overallScore)}
          </div>
          <div className="text-lg text-muted-foreground font-medium">/100</div>
          <div className="text-xs text-card-foreground font-medium mt-2">Interview Score</div>
          <div className="text-xs text-muted-foreground italic">Updates in real-time</div>
        </div>
      </div>
    </div>
  );
}
