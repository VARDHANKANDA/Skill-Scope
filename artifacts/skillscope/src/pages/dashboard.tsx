import { useGetDashboardSummary, useGetActivityHeatmap, useGetMonthlyProgress } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Activity, Code2, FolderGit2, MessageSquare, Sparkles, Star, Target, Trophy, GitCommit } from 'lucide-react';
import ActivityHeatmap from '@/components/dashboard/activity-heatmap';
import MonthlyProgressChart from '@/components/dashboard/monthly-progress';

export default function DashboardPage() {
  const { data: summary, isLoading: isLoadingSummary, error: summaryError, refetch: refetchSummary } = useGetDashboardSummary();
  const { data: heatmapData, isLoading: isLoadingHeatmap } = useGetActivityHeatmap();
  const { data: monthlyData, isLoading: isLoadingMonthly } = useGetMonthlyProgress();

  if (isLoadingSummary) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="h-96 md:col-span-4 rounded-xl" />
          <Skeleton className="h-96 md:col-span-3 rounded-xl" />
        </div>
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-xl font-bold text-foreground">Failed to load dashboard</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {(summaryError as any)?.message || 'An unexpected error occurred while fetching your dashboard overview.'}
          </p>
          <Button onClick={() => refetchSummary()} className="w-full sm:w-auto px-6">
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here's your developer intelligence overview.
        </p>
      </div>

      {/* Gamification & Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.overallScore}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Top {(100 - summary.overallScore).toFixed(1)}% of developers
            </p>
            <Progress value={summary.overallScore} className="h-1.5 mt-3" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Level {summary.level || 1}</CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.xp || 0} XP</div>
            <p className="text-xs text-muted-foreground mt-1">
              Current streak: {summary.streak} days
            </p>
            <Progress value={((summary.xp || 0) % 1000) / 10} className="h-1.5 mt-3 bg-amber-100" indicatorClassName="bg-amber-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Problems Solved</CardTitle>
            <Code2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.problemsSolved || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Source</CardTitle>
            <FolderGit2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRepos || 0} Repos</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Star className="h-3 w-3" /> {summary.totalStars || 0} total stars
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Radars & Heatmap */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-4 flex flex-col">
          <CardHeader>
            <CardTitle>Contribution Heatmap</CardTitle>
            <CardDescription>
              Your coding activity across GitHub and competitive programming platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoadingHeatmap ? (
              <Skeleton className="h-[200px] w-full" />
            ) : heatmapData ? (
              <ActivityHeatmap data={heatmapData} />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                <div className="flex flex-col items-center gap-2 text-sm">
                  <Activity className="h-8 w-8 opacity-20" />
                  No activity data available
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Skill Breakdown</CardTitle>
            <CardDescription>
              Component scores making up your overall rating
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center gap-6">
            <ScoreRow label="Coding & Algorithms" score={summary.codingScore} icon={Code2} color="text-blue-500" bg="bg-blue-500" />
            <ScoreRow label="Project Architecture" score={summary.projectScore} icon={FolderGit2} color="text-emerald-500" bg="bg-emerald-500" />
            <ScoreRow label="Interview Readiness" score={summary.interviewScore} icon={MessageSquare} color="text-purple-500" bg="bg-purple-500" />
            <ScoreRow label="Open Source Impact" score={summary.openSourceScore} icon={GitCommit} color="text-orange-500" bg="bg-orange-500" />
            <ScoreRow label="Resume Quality" score={summary.resumeScore} icon={Sparkles} color="text-pink-500" bg="bg-pink-500" />
          </CardContent>
        </Card>
      </div>

      {/* Monthly Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Trajectory</CardTitle>
          <CardDescription>
            Your overall score progression over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMonthly ? (
            <Skeleton className="h-[300px] w-full" />
          ) : monthlyData ? (
            <MonthlyProgressChart data={monthlyData} />
          ) : (
            <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">Not enough historical data</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Complete assessments, connect coding platforms, and sync GitHub to build your growth trajectory.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreRow({ label, score, icon: Icon, color, bg }: { label: string, score: number, icon: any, color: string, bg: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-bold">{score}</span>
      </div>
      <Progress value={score} className="h-2" indicatorClassName={bg} />
    </div>
  );
}
