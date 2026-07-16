import { useGetSkills, useGetSkillCategories, useAnalyzeSkills } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BrainCircuit, Sparkles, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSkillsQueryKey, getGetSkillCategoriesQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function SkillsPage() {
  const { data: skills, isLoading: skillsLoading } = useGetSkills();
  const { data: categories, isLoading: categoriesLoading } = useGetSkillCategories();
  const analyzeSkills = useAnalyzeSkills();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAnalyze = () => {
    analyzeSkills.mutate(undefined, {
      onSuccess: (res) => {
        toast({
          title: "Analysis Complete",
          description: `Detected ${res.skillsDetected} skills from your profile.`,
        });
        queryClient.invalidateQueries({ queryKey: getGetSkillsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSkillCategoriesQueryKey() });
      },
      onError: () => {
        toast({
          title: "Analysis Failed",
          description: "Could not analyze skills. Please ensure your GitHub is connected.",
          variant: "destructive"
        });
      }
    });
  };

  const radarData = categories?.map(c => ({
    subject: c.category,
    A: c.score,
    fullMark: 100,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Skill Matrix</h1>
          <p className="text-muted-foreground">
            Your capabilities quantified automatically from your code and activity.
          </p>
        </div>
        <Button onClick={handleAnalyze} disabled={analyzeSkills.isPending} className="shrink-0 gap-2">
          <Sparkles className="h-4 w-4" />
          {analyzeSkills.isPending ? "Analyzing..." : "Re-analyze Skills"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Skill Shape</CardTitle>
            <CardDescription>Your technical footprint</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[300px]">
            {categoriesLoading ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : categories && categories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Skills"
                    dataKey="A"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                <BrainCircuit className="h-12 w-12 mb-4 opacity-20" />
                <p>Run analysis to generate your skill shape.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {categoriesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
            </div>
          ) : categories && categories.length > 0 ? (
            categories?.map((category) => (
              <Card key={category.category}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category.category}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{category.score}/100</span>
                    </div>
                  </div>
                  <Progress value={category.score} className="h-1.5" />
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {category.skills.map((skill) => (
                      <div key={skill.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: skill.color || 'hsl(var(--primary))' }} />
                          <div>
                            <div className="font-medium text-sm flex items-center gap-2">
                              {skill.name}
                              {skill.confidence === 'high' && (
                                <span title="High Confidence">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                </span>
                              )}
                              {skill.confidence === 'low' && (
                                <span title="Low Confidence (Needs more data)">
                                  <AlertCircle className="h-3 w-3 text-amber-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">Level {Math.ceil(skill.score / 20)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="font-mono text-xs">{skill.score}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-12 text-center bg-muted/10 border-dashed">
              <BrainCircuit className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold">No Skills Detected</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                We need to analyze your connected accounts to build your skill matrix. Make sure you've connected GitHub first.
              </p>
              <Button onClick={handleAnalyze} className="mt-6" disabled={analyzeSkills.isPending}>
                {analyzeSkills.isPending ? "Analyzing..." : "Analyze Now"}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
