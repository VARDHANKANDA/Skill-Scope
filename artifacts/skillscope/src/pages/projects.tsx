import { useGetProjects } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderGit2, Star, ChevronRight, BarChart3, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

const DIFFICULTY_COLORS = {
  beginner: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  intermediate: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  advanced: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  expert: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function ProjectsPage() {
  const { data: projects, isLoading } = useGetProjects();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Intelligence</h1>
          <p className="text-muted-foreground">
            Deep analysis of your most significant repositories.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col group hover:shadow-md transition-all border-border/50">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div className="flex items-center gap-2 text-primary font-semibold truncate">
                    <FolderGit2 className="h-5 w-5 shrink-0" />
                    <span className="truncate">{project.name}</span>
                  </div>
                  <Badge variant="secondary" className={DIFFICULTY_COLORS[project.difficulty] || ''}>
                    {project.difficulty}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 h-10">
                  {project.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 pb-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4" /> Code Quality
                    </span>
                    <span className="font-bold">{project.score}/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${project.score >= 80 ? 'bg-emerald-500' : project.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} 
                      style={{ width: `${project.score}%` }} 
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {project.language && (
                    <Badge variant="outline" className="bg-primary/5 border-primary/10">
                      {project.language}
                    </Badge>
                  )}
                  {project.techStack?.slice(0, 3).map(tech => (
                    <Badge key={tech} variant="outline" className="bg-muted border-muted-foreground/20">
                      {tech}
                    </Badge>
                  ))}
                  {(project.techStack?.length || 0) > 3 && (
                    <Badge variant="outline" className="bg-muted border-muted-foreground/20 text-muted-foreground">
                      +{(project.techStack?.length || 0) - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 border-t bg-muted/10 px-6 py-4 mt-auto flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" /> {project.stars}</span>
                </div>
                <Link href={`/projects/${project.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 gap-1 pr-2">
                    View Analysis <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed border-border/40">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
            <FolderGit2 className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold">You haven't created any projects yet</h3>
          <p className="text-muted-foreground mt-2 max-w-md mb-6">
            Start building your first project! Connect your GitHub account to analyze your repositories and generate deep project intelligence.
          </p>
          <Link href="/github">
            <Button className="gap-2">Connect GitHub to Get Started</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
