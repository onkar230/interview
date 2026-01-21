'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle,
  Clock,
  BarChart3,
  Calendar,
  Building2,
  Trash2,
  Target,
  TrendingUp,
  ArrowRight,
  Check,
  Sparkles,
  Mic,
  Video,
  MessageSquare,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserNav from '@/components/navigation/UserNav';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionBadge } from '@/components/subscription/SubscriptionBadge';
import { Crown } from 'lucide-react';

interface InterviewSession {
  id: string;
  industry: string;
  role: string;
  company: string;
  difficulty: string;
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  interview_evaluations: Array<{
    overall_score: number | null;
    verdict: string | null;
    communication_score: number | null;
    technical_score: number | null;
    problem_solving_score: number | null;
    relevant_experience_score: number | null;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    averageScore: 0,
  });

  const {
    tier,
    interviewsUsed,
    interviewLimit,
    canStartInterview,
    upgradeToPro,
    manageSubscription,
    isLoading: subscriptionLoading
  } = useSubscription();

  const ITEMS_PER_PAGE = 5;

  // Calculate pagination
  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSessions = sessions.slice(startIndex, endIndex);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/interview/sessions');
        if (!response.ok) throw new Error('Failed to fetch sessions');

        const data = await response.json();
        setSessions(data.sessions || []);

        // Calculate stats
        const total = data.sessions?.length || 0;
        const completed = data.sessions?.filter((s: InterviewSession) => s.status === 'completed').length || 0;
        const inProgress = data.sessions?.filter((s: InterviewSession) => s.status === 'active').length || 0;

        // Calculate average score from completed interviews
        const scoresSum = data.sessions
          ?.filter((s: InterviewSession) => s.interview_evaluations?.[0]?.overall_score)
          .reduce((sum: number, s: InterviewSession) => sum + (s.interview_evaluations[0].overall_score || 0), 0) || 0;
        const scoresCount = data.sessions?.filter((s: InterviewSession) => s.interview_evaluations?.[0]?.overall_score).length || 0;
        const averageScore = scoresCount > 0 ? scoresSum / scoresCount : 0;

        setStats({ total, completed, inProgress, averageScore });
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilReset = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysLeft = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-accent text-accent-foreground border border-border">
            <CheckCircle className="h-3 w-3 mr-1.5" aria-hidden="true" />
            Completed
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
            <Clock className="h-3 w-3 mr-1.5" aria-hidden="true" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
            Pending
          </span>
        );
    }
  };

  const getVerdictDisplay = (verdict: string | null, score: number | null) => {
    if (!verdict) return null;

    switch (verdict) {
      case 'pass':
        return (
          <span className="text-primary font-semibold">
            Pass
          </span>
        );
      case 'borderline':
        return (
          <span className="text-muted-foreground font-semibold">
            Borderline
          </span>
        );
      case 'fail':
        return (
          <span className="text-destructive font-semibold">
            Needs Work
          </span>
        );
      default:
        return null;
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      return;
    }

    setDeletingId(sessionId);
    try {
      const response = await fetch(`/api/interview/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete session');

      // Remove from UI
      setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));

      // Recalculate stats
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      const total = updatedSessions.length;
      const completed = updatedSessions.filter(s => s.status === 'completed').length;
      const inProgress = updatedSessions.filter(s => s.status === 'active').length;
      const scoresSum = updatedSessions
        .filter(s => s.interview_evaluations?.[0]?.overall_score)
        .reduce((sum, s) => sum + (s.interview_evaluations[0].overall_score || 0), 0);
      const scoresCount = updatedSessions.filter(s => s.interview_evaluations?.[0]?.overall_score).length;
      const averageScore = scoresCount > 0 ? scoresSum / scoresCount : 0;

      setStats({ total, completed, inProgress, averageScore });

      // Reset to page 1 if current page is now empty
      const newTotalPages = Math.ceil(updatedSessions.length / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete interview. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Clean, task-focused for authenticated users */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Mojo Interview Logo"
            width={48}
            height={48}
            className="object-contain"
          />
          <span className="text-2xl font-bold text-primary">Mojo Interview</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/feedback" className="text-foreground hover:text-primary transition-colors">
            Feedback
          </Link>
          <UserNav />
        </div>
      </nav>

      {/* Hero/Welcome Section - Centered, Inspirational */}
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Welcome to Your{' '}
          <span className="text-primary">Practice Space</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Practise a little more, improve a little more, and build real confidence along the way.
        </p>

      </div>

      {/* Stats Section - Centered Header */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Your Progress at a Glance
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how far you have come in your interview preparation journey
          </p>
        </div>

        {/* Stats Cards - Matching Landing Page Proportions (p-8, h-14 w-14 rounded-xl, h-7 w-7 icons) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          <div className="bg-card rounded-xl p-8 border border-border">
            <div className="flex items-center justify-center mb-4">
              <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center">
                <BarChart3 className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground mb-1">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Interviews</p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-8 border border-border">
            <div className="flex items-center justify-center mb-4">
              <div className="h-14 w-14 bg-accent rounded-xl flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-accent-foreground" aria-hidden="true" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground mb-1">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-8 border border-border">
            <div className="flex items-center justify-center mb-4">
              <div className="h-14 w-14 bg-secondary rounded-xl flex items-center justify-center">
                <Clock className="h-7 w-7 text-secondary-foreground" aria-hidden="true" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground mb-1">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-8 border border-border">
            <div className="flex items-center justify-center mb-4">
              <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground mb-1">
                {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : '-'}
                {stats.averageScore > 0 && <span className="text-lg text-muted-foreground">/10</span>}
              </p>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </div>
          </div>
        </div>

        {/* Subscription Status Card */}
        <div className="max-w-5xl mx-auto mt-8">
          {subscriptionLoading ? (
            <div className="bg-card rounded-xl p-6 border-2 border-border animate-pulse">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 w-full">
                  <div className="h-8 bg-muted rounded w-2/3 mb-4"></div>
                  <div className="h-3 bg-muted rounded-full mb-4"></div>
                </div>
                <div className="flex-shrink-0">
                  <div className="h-12 w-48 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ) : tier === 'free' ? (
            <div className="bg-card rounded-xl p-6 border-2 border-amber-300">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <SubscriptionBadge tier="free" />
                    <h3 className="text-xl font-semibold text-foreground">
                      {canStartInterview
                        ? `${interviewLimit! - interviewsUsed} of ${interviewLimit} interview${interviewLimit === 1 ? '' : 's'} left this month`
                        : 'Monthly limit reached'}
                    </h3>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          canStartInterview ? 'bg-accent' : 'bg-amber-500'
                        }`}
                        style={{
                          width: `${interviewLimit ? ((interviewLimit - interviewsUsed) / interviewLimit) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Only show reset countdown AFTER they've used their interview */}
                  {!canStartInterview && (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">
                        Resets in {getDaysUntilReset()} day{getDaysUntilReset() === 1 ? '' : 's'}
                      </p>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800 font-medium">
                          You've used your free interview this month. Upgrade to Pro for unlimited interviews!
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <Button
                    size="lg"
                    onClick={upgradeToPro}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold px-8"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    £14.99/month • 7-day free trial
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl p-6 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Crown className="h-6 w-6" />
                    <h3 className="text-2xl font-bold">Pro Member</h3>
                  </div>
                  <p className="text-white/90">
                    You have unlimited interviews • Keep practicing!
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <Button
                    size="lg"
                    onClick={manageSubscription}
                    variant="outline"
                    className="bg-white text-amber-600 hover:bg-white/90 border-0 px-6"
                  >
                    Manage Subscription
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Dark Teal "Practice Room" Bridge Section - Matches Interview Session Theme */}
      <div className="bg-primary py-20 relative overflow-hidden">
        {/* Subtle decorative elements mimicking interview session UI */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-8 top-8 bottom-8 w-64 border border-primary-foreground/20 rounded-lg" />
          <div className="absolute right-8 top-8 bottom-8 w-64 border border-primary-foreground/20 rounded-lg" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          {/* Bot avatar - matches interview session */}
          <div className="flex justify-center mb-8">
            <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center border-2 border-accent/30">
              <Bot className="h-10 w-10 text-accent" aria-hidden="true" />
            </div>
          </div>

          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Experience a realistic interview environment with AI-powered feedback.
          </p>

          {/* Feature pills - styled like interview session UI elements */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            <div className="flex items-center gap-2 bg-primary/50 backdrop-blur-sm border border-primary-foreground/20 rounded-lg px-4 py-2">
              <Video className="h-4 w-4 text-accent" aria-hidden="true" />
              <span className="text-sm text-primary-foreground/90">Live Webcam</span>
            </div>
            <div className="flex items-center gap-2 bg-primary/50 backdrop-blur-sm border border-primary-foreground/20 rounded-lg px-4 py-2">
              <Mic className="h-4 w-4 text-accent" aria-hidden="true" />
              <span className="text-sm text-primary-foreground/90">Voice Recording</span>
            </div>
            <div className="flex items-center gap-2 bg-primary/50 backdrop-blur-sm border border-primary-foreground/20 rounded-lg px-4 py-2">
              <MessageSquare className="h-4 w-4 text-accent" aria-hidden="true" />
              <span className="text-sm text-primary-foreground/90">Real-time Feedback</span>
            </div>
          </div>

          <Button
            onClick={() => router.push('/interview/configure')}
            size="lg"
            className="px-12 py-7 text-lg bg-accent hover:bg-accent/90 text-accent-foreground shadow-2xl"
          >
            Enter Practice Room
            <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
          </Button>

          <p className="text-sm text-primary-foreground/60 mt-6">
            Take a deep breath. You have got this.
          </p>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-xl p-8 border-2 border-accent/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                  <MessageSquare className="h-6 w-6 text-accent" />
                  <h3 className="text-2xl font-bold text-foreground">Share Your Feedback</h3>
                </div>
                <p className="text-muted-foreground">
                  Help us improve! Follow the Google Form link to share your thoughts and suggestions.
                </p>
              </div>
              <div className="flex-shrink-0">
                <a
                  href="https://forms.gle/dFtAVdEtGJAgfpaQA"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground px-8"
                  >
                    Open Feedback Form
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interview History Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Your Interview History
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Review past sessions, track your growth, and continue where you left off
          </p>
        </div>

        {/* Interview History - Card-Based Layout */}
        {isLoading ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center max-w-4xl mx-auto">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading your interviews...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 bg-muted rounded-xl flex items-center justify-center">
                <Target className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              No interviews yet
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start your first AI mock interview to see your progress here.
              Every expert was once a beginner.
            </p>
            <Button
              onClick={() => router.push('/interview/configure')}
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg"
            >
              <Sparkles className="h-5 w-5 mr-2" aria-hidden="true" />
              Start Your First Interview
            </Button>
          </div>
        ) : (
          <div className="space-y-4 max-w-5xl mx-auto">
            {paginatedSessions.map((session) => (
              <div
                key={session.id}
                className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow"
              >
                {/* Desktop Layout - Grid for alignment with fixed column widths */}
                <div className="hidden lg:grid lg:grid-cols-[1fr_100px_110px_115px_60px_85px_140px] lg:items-center lg:gap-4">
                  {/* Company & Role - flexible width, takes remaining space */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif text-xl font-semibold text-foreground truncate">
                        {session.company}
                      </h3>
                      <p className="text-muted-foreground truncate">{session.role}</p>
                    </div>
                  </div>

                  {/* Industry - 100px fixed */}
                  <div className="text-sm text-foreground capitalize truncate">
                    {session.industry}
                  </div>

                  {/* Date - 110px fixed */}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">{formatDate(session.created_at)}</span>
                  </div>

                  {/* Status - 115px fixed */}
                  <div>
                    {getStatusBadge(session.status)}
                  </div>

                  {/* Score - 60px fixed */}
                  <div className="text-sm">
                    {session.interview_evaluations?.[0]?.overall_score ? (
                      <>
                        <span className="font-semibold text-foreground">
                          {session.interview_evaluations[0].overall_score.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">/10</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>

                  {/* Verdict - 85px fixed */}
                  <div className="text-sm">
                    {session.interview_evaluations?.[0]?.verdict ? (
                      getVerdictDisplay(
                        session.interview_evaluations[0].verdict,
                        session.interview_evaluations[0].overall_score
                      )
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>

                  {/* Actions - 140px fixed */}
                  <div className="flex items-center gap-2 justify-end">
                    {session.status === 'completed' && session.interview_evaluations?.[0] ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/interview/feedback?sessionId=${session.id}`)}
                        className="gap-1.5"
                      >
                        Feedback
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    ) : session.status === 'active' ? (
                      <Button
                        size="sm"
                        onClick={() => router.push(`/interview/session?sessionId=${session.id}`)}
                        className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        Resume
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    ) : null}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSession(session.id)}
                      disabled={deletingId === session.id}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      aria-label="Delete interview"
                    >
                      {deletingId === session.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Mobile Layout - Stacked for readability */}
                <div className="lg:hidden">
                  {/* Header with company info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-xl font-semibold text-foreground truncate">
                        {session.company}
                      </h3>
                      <p className="text-muted-foreground truncate">{session.role}</p>
                    </div>
                  </div>

                  {/* Meta grid - 2 columns on mobile */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Industry</span>
                      <span className="text-foreground capitalize">{session.industry}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Date</span>
                      <span className="text-foreground">{formatDate(session.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Status</span>
                      {getStatusBadge(session.status)}
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wide mb-0.5">Score</span>
                      {session.interview_evaluations?.[0]?.overall_score ? (
                        <span className="text-foreground">
                          <span className="font-semibold">
                            {session.interview_evaluations[0].overall_score.toFixed(1)}
                          </span>
                          /10
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  {/* Verdict and Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="text-sm">
                      {session.interview_evaluations?.[0]?.verdict ? (
                        <>
                          <span className="text-muted-foreground mr-1.5">Verdict:</span>
                          {getVerdictDisplay(
                            session.interview_evaluations[0].verdict,
                            session.interview_evaluations[0].overall_score
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">No verdict yet</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {session.status === 'completed' && session.interview_evaluations?.[0] ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/interview/feedback?sessionId=${session.id}`)}
                          className="gap-1.5"
                        >
                          Feedback
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      ) : session.status === 'active' ? (
                        <Button
                          size="sm"
                          onClick={() => router.push(`/interview/session?sessionId=${session.id}`)}
                          className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground"
                        >
                          Resume
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      ) : null}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={deletingId === session.id}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label="Delete interview"
                      >
                        {deletingId === session.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3"
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={
                      currentPage === page
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 min-w-[2.5rem]'
                        : 'min-w-[2.5rem]'
                    }
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Matches Landing Page */}
      <div className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>© 2024 Mojo Interview. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
