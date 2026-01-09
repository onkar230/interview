'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  TrendingUp,
  CheckCircle,
  Clock,
  BarChart3,
  Calendar,
  Building2,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserNav from '@/components/navigation/UserNav';

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
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    averageScore: 0,
  });

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Pending
          </span>
        );
    }
  };

  const getVerdictBadge = (verdict: string | null) => {
    if (!verdict) return null;

    switch (verdict) {
      case 'pass':
        return <span className="text-green-600 font-semibold">✓ Pass</span>;
      case 'borderline':
        return <span className="text-yellow-600 font-semibold">~ Borderline</span>;
      case 'fail':
        return <span className="text-red-600 font-semibold">✗ Fail</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Matches Homepage Navigation */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => router.push('/interview/select')}
              className="text-2xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              InterviewAI
            </button>

            {/* User Menu */}
            <UserNav />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Interview Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and continue practicing</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Interviews</p>
            <p className="text-3xl font-bold text-foreground mt-2">{stats.total}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm font-medium text-muted-foreground">Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm font-medium text-muted-foreground">In Progress</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.inProgress}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
            <p className="text-3xl font-bold text-primary mt-2">
              {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : '-'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Interview History</h2>
          <Button onClick={() => router.push('/interview/configure')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Interview
          </Button>
        </div>

        {/* Interview History Table */}
        {isLoading ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading your interviews...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No interviews yet</h3>
            <p className="text-muted-foreground mb-6">Start your first AI mock interview to see your progress here</p>
            <Button onClick={() => router.push('/interview/configure')}>
              <Plus className="h-4 w-4 mr-2" />
              Start Your First Interview
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Company & Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Verdict
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-5 w-5 text-muted-foreground mr-3" />
                          <div>
                            <div className="text-sm font-medium text-foreground">{session.company}</div>
                            <div className="text-sm text-muted-foreground">{session.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-foreground capitalize">{session.industry}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(session.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(session.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-foreground">
                          {session.interview_evaluations?.[0]?.overall_score
                            ? `${session.interview_evaluations[0].overall_score.toFixed(1)}/10`
                            : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVerdictBadge(session.interview_evaluations?.[0]?.verdict || null)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {session.status === 'completed' && session.interview_evaluations?.[0] ? (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/interview/feedback?sessionId=${session.id}`)}
                            >
                              View Feedback
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/interview/evaluation?sessionId=${session.id}`)}
                            >
                              View Report
                            </Button>
                          </div>
                        ) : session.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/interview/session?sessionId=${session.id}`)}
                          >
                            Resume
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
