import { useGetProject, getGetProjectQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useParams, Link } from 'wouter';
import { 
  ArrowLeft, 
  ExternalLink, 
  LayoutTemplate, 
  ShieldCheck, 
  Activity, 
  FileCode2, 
  BookOpen,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = id ? parseInt(id, 10) : 0;
  
  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full max-w-2xl" />
          </CardHeader>
        </Card>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 md:col-span-2 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold mb-2">Project not found</h2>
        <Link href="/projects">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground mt-2 max-w-3xl">
              {project.description || "No description provided."}
            </p>
          </div>
          {project.htmlUrl && (
            <a href={project.htmlUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" className="shrink-0">
                <ExternalLink className="mr-2 h-4 w-4" /> View on GitHub
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="px-3 py-1 text-sm">{project.difficulty} difficulty</Badge>
        {project.language && <Badge variant="outline" className="px-3 py-1 text-sm bg-primary/5">{project.language}</Badge>}
        <Badge variant="outline" className="px-3 py-1 text-sm">Overall Score: {project.score}/100</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Architecture & Summary */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-primary" /> Architecture Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none text-sm">
                <p>{project.architecture || project.summary || "Architecture analysis not available for this project yet."}</p>
              </div>
              
              {project.techStack && project.techStack.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Detected Tech Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map(tech => (
                      <Badge key={tech} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {project.designPatterns && project.designPatterns.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Design Patterns Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.designPatterns.map(pattern => (
                      <Badge key={pattern} variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {project.performanceSuggestions && project.performanceSuggestions.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
                  <Lightbulb className="h-5 w-5" /> Improvement Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {project.performanceSuggestions.map((suggestion, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quality Metrics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quality Metrics</CardTitle>
              <CardDescription>Automated code analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <MetricRow 
                label="Maintainability" 
                score={project.maintainabilityIndex} 
                icon={Activity} 
              />
              <MetricRow 
                label="Code Complexity" 
                score={project.codeComplexity} 
                icon={FileCode2} 
                invertColor // Lower complexity is better usually, but assuming 0-100 score where 100 is best here
              />
              <MetricRow 
                label="Readability" 
                score={project.readabilityScore} 
                icon={BookOpen} 
              />
              <MetricRow 
                label="Testing" 
                score={project.testingScore} 
                icon={ShieldCheck} 
              />
              <MetricRow 
                label="Security" 
                score={project.securityScore} 
                icon={ShieldCheck} 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, score, icon: Icon, invertColor = false }: { label: string, score: number, icon: any, invertColor?: boolean }) {
  // If invertColor is true, lower score gets green. 
  // Assuming the API normalizes all scores to 0-100 where 100 is always BEST.
  const displayScore = score || 0;
  let colorClass = 'bg-primary';
  let textClass = 'text-primary';
  
  if (displayScore >= 80) {
    colorClass = 'bg-emerald-500';
    textClass = 'text-emerald-500';
  } else if (displayScore >= 60) {
    colorClass = 'bg-amber-500';
    textClass = 'text-amber-500';
  } else {
    colorClass = 'bg-red-500';
    textClass = 'text-red-500';
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </div>
        <span className={`text-sm font-bold ${textClass}`}>{displayScore}/100</span>
      </div>
      <Progress value={displayScore} className="h-1.5" indicatorClassName={colorClass} />
    </div>
  );
}
