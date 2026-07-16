import { useGetInterviewReadiness } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, Target, CheckCircle2, AlertCircle, BookOpen, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function InterviewPage() {
  const { data: readiness, isLoading } = useGetInterviewReadiness();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-6">
          <Skeleton className="h-40 w-1/3 rounded-xl" />
          <Skeleton className="h-40 w-2/3 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!readiness) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-bold">Interview Readiness Not Available</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          Analyze your skills first to generate your interview readiness report.
        </p>
      </div>
    );
  }

  const roleChartData = readiness.roles.map(r => ({
    name: r.role,
    value: r.readiness,
    // Add color based on readiness
    color: r.readiness >= 80 ? 'hsl(142 71% 45%)' : r.readiness >= 60 ? 'hsl(38 92% 50%)' : 'hsl(348 83% 47%)'
  }));

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interview Readiness</h1>
        <p className="text-muted-foreground">
          AI-predicted probability of passing technical screens based on your proven skills.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 bg-primary text-primary-foreground border-none">
          <CardHeader>
            <CardTitle className="text-primary-foreground/80">Overall Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-8 border-primary-foreground/20">
              <span className="text-4xl font-black">{readiness.overallReadiness}%</span>
            </div>
            <p className="mt-6 text-center text-sm text-primary-foreground/80 font-medium px-4">
              {readiness.overallReadiness >= 80 
                ? "You are highly competitive for target roles." 
                : readiness.overallReadiness >= 60 
                ? "You're getting close. Focus on your weaknesses."
                : "Significant skill gaps detected. Follow the learning plan."}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Role Match Analysis</CardTitle>
            <CardDescription>Predicted success rate by position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
                  <Tooltip 
                    formatter={(value) => [`${value}% Match`, '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {roleChartData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-4 border-b">
            <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
              <CheckCircle2 className="h-5 w-5" /> Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-4">
              {readiness.strengths.map((strength, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <span className="mt-0.5 leading-tight">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4 border-b">
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
              <AlertCircle className="h-5 w-5" /> Critical Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-4">
              {readiness.weaknesses.map((weakness, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-3.5 w-3.5" />
                  </div>
                  <span className="mt-0.5 leading-tight">{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" /> Recommended Action Plan
          </CardTitle>
          <CardDescription>Highest ROI actions to improve your hireability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {readiness.learningPlan.map((action, i) => (
              <div key={i} className="p-4 rounded-xl border bg-muted/20 hover:bg-muted/50 transition-colors">
                <div className="text-blue-500 font-bold mb-2 text-lg">0{i + 1}</div>
                <p className="text-sm font-medium">{action}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
