import { useState } from 'react';
import { useGetRoadmap, useGetRoadmapGoals, useCompleteGoal } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getGetRoadmapGoalsQueryKey, getGetGamificationProfileQueryKey } from '@workspace/api-client-react';
import { MapPin, Target, CheckCircle2, Circle, Loader2, Milestone, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Goal } from '@workspace/api-client-react';

export default function RoadmapPage() {
  const { data: roadmap, isLoading: roadmapLoading } = useGetRoadmap();
  const { data: goalsData, isLoading: goalsLoading } = useGetRoadmapGoals();
  const completeGoal = useCompleteGoal();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [completingId, setCompletingId] = useState<number | null>(null);

  const handleCompleteGoal = (goal: Goal) => {
    setCompletingId(goal.id);
    completeGoal.mutate({ id: goal.id }, {
      onSuccess: () => {
        toast({
          title: "Goal Completed! 🎉",
          description: `You earned ${goal.xpReward || 0} XP.`,
        });
        queryClient.invalidateQueries({ queryKey: getGetRoadmapGoalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGamificationProfileQueryKey() });
      },
      onSettled: () => setCompletingId(null),
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Learning Roadmap</h1>
        <p className="text-muted-foreground">
          Your personalized path to your target role.
        </p>
      </div>

      {roadmapLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ) : roadmap ? (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Target: {roadmap.targetRole}
                </CardTitle>
                <CardDescription className="mt-1 font-medium">
                  Current Level: {roadmap.currentLevel}
                </CardDescription>
              </div>
              <div className="md:text-right">
                <div className="text-2xl font-bold text-primary">{roadmap.progressPercent}%</div>
                <div className="text-sm text-muted-foreground">Overall Completion</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={roadmap.progressPercent} className="h-2" />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Milestone className="h-5 w-5" /> Path Phases
          </h2>
          
          <div className="relative border-l-2 border-muted ml-3 space-y-8 pl-6">
            {roadmapLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="relative">
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
              ))
            ) : roadmap && roadmap.phases.length > 0 ? (
              roadmap.phases.map((phase) => (
                <div key={phase.phase} className="relative">
                  <div className={`absolute -left-[35px] h-6 w-6 rounded-full border-4 border-background flex items-center justify-center ${phase.isCompleted ? 'bg-emerald-500' : 'bg-muted-foreground'}`}>
                    {phase.isCompleted && <CheckCircle2 className="h-4 w-4 text-background" />}
                  </div>
                  <Card className={phase.isCompleted ? 'opacity-70' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Phase {phase.phase}: {phase.title}</CardTitle>
                        {phase.isCompleted ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>
                        ) : (
                          <Badge variant="outline">In Progress</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {phase.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                            <span className={phase.isCompleted ? 'line-through text-muted-foreground' : ''}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">No roadmap phases generated yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5" /> Active Goals
          </h2>
          
          <Card>
            <Tabs defaultValue="daily" className="w-full">
              <CardHeader className="pb-0 px-4 pt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4 px-4 pb-4">
                {goalsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : goalsData ? (
                  <>
                    <TabsContent value="daily" className="m-0 space-y-3">
                      <GoalList goals={goalsData.daily} onComplete={handleCompleteGoal} completingId={completingId} />
                    </TabsContent>
                    <TabsContent value="weekly" className="m-0 space-y-3">
                      <GoalList goals={goalsData.weekly} onComplete={handleCompleteGoal} completingId={completingId} />
                    </TabsContent>
                    <TabsContent value="monthly" className="m-0 space-y-3">
                      <GoalList goals={goalsData.monthly} onComplete={handleCompleteGoal} completingId={completingId} />
                    </TabsContent>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-4">No goals active.</div>
                )}
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GoalList({ goals, onComplete, completingId }: { goals: Goal[], onComplete: (goal: Goal) => void, completingId: number | null }) {
  if (!goals || goals.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
        All caught up! No active goals.
      </div>
    );
  }

  return (
    <>
      {goals.map((goal) => (
        <div key={goal.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${goal.isCompleted ? 'bg-muted/50 border-muted' : 'bg-card hover:bg-muted/30'}`}>
          <button 
            disabled={goal.isCompleted || completingId !== null}
            onClick={() => onComplete(goal)}
            className={`mt-0.5 shrink-0 transition-colors ${goal.isCompleted ? 'text-emerald-500' : 'text-muted-foreground hover:text-primary'}`}
            aria-label={goal.isCompleted ? "Completed" : "Mark as complete"}
          >
            {goal.isCompleted 
              ? <CheckCircle2 className="h-5 w-5" /> 
              : completingId === goal.id 
                ? <Loader2 className="h-5 w-5 animate-spin text-primary" />
                : <Circle className="h-5 w-5" />}
          </button>
          <div className="flex-1">
            <p className={`text-sm font-medium ${goal.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {goal.title}
            </p>
            {goal.xpReward && (
              <p className="text-xs font-bold text-amber-500 mt-1">+{goal.xpReward} XP</p>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
