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
  industry?: string;
}

export default function PerformanceScore({ overallScore, categoryScores, answersCount, industry }: PerformanceScoreProps) {
  // Get industry-specific label for second category
  const secondCategoryLabel = industry === 'law' ? 'Commercial Awareness' : 'Technical Skills';

  // Auto-convert old 0-100 scores to 0-10 scale
  const normalizeScore = (score: number) => score > 10 ? score / 10 : score;

  const normalizedScores = {
    communication: normalizeScore(categoryScores.communication),
    technicalKnowledge: normalizeScore(categoryScores.technicalKnowledge),
    problemSolving: normalizeScore(categoryScores.problemSolving),
    relevantExperience: normalizeScore(categoryScores.relevantExperience),
  };

  const normalizedOverall = normalizeScore(overallScore);

  // Calculate color based on score (0-10 scale)
  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 5) return 'text-amber-600';
    return 'text-red-600';
  };

  const getBarColor = (score: number) => {
    if (score >= 7) return 'bg-green-600';
    if (score >= 5) return 'bg-amber-600';
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
                className={`h-full transition-all duration-500 ${getBarColor(normalizedScores.communication)}`}
                style={{ width: `${(normalizedScores.communication / 10) * 100}%` }}
              />
            </div>
            <div className="w-10 text-xs text-right text-muted-foreground">
              {normalizedScores.communication.toFixed(1)}/10
            </div>
          </div>

          {/* Technical Knowledge / Commercial Awareness */}
          <div className="flex items-center gap-3">
            <div className="w-32 text-xs font-medium text-card-foreground">{secondCategoryLabel}</div>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getBarColor(normalizedScores.technicalKnowledge)}`}
                style={{ width: `${(normalizedScores.technicalKnowledge / 10) * 100}%` }}
              />
            </div>
            <div className="w-10 text-xs text-right text-muted-foreground">
              {normalizedScores.technicalKnowledge.toFixed(1)}/10
            </div>
          </div>

          {/* Problem Solving */}
          <div className="flex items-center gap-3">
            <div className="w-32 text-xs font-medium text-card-foreground">Problem Solving</div>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getBarColor(normalizedScores.problemSolving)}`}
                style={{ width: `${(normalizedScores.problemSolving / 10) * 100}%` }}
              />
            </div>
            <div className="w-10 text-xs text-right text-muted-foreground">
              {normalizedScores.problemSolving.toFixed(1)}/10
            </div>
          </div>
        </div>

        {/* Right side: Overall score */}
        <div className="flex flex-col items-center justify-center px-6 border-l border-border">
          <div className={`text-5xl font-bold ${getScoreColor(normalizedOverall)} transition-all duration-500`}>
            {normalizedOverall.toFixed(1)}
          </div>
          <div className="text-lg text-muted-foreground font-medium">/10</div>
          <div className="text-xs text-card-foreground font-medium mt-2">Interview Score</div>
          <div className="text-xs text-muted-foreground italic">Updates in real-time</div>
        </div>
      </div>
    </div>
  );
}
