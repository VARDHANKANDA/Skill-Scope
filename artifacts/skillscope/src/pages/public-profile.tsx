import { useGetPublicProfile, getGetPublicProfileQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useParams, Link } from 'wouter';
import { 
  Github, 
  MapPin, 
  GraduationCap, 
  Code2, 
  Star,
  GitFork,
  CheckCircle2,
  FolderGit2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PublicProfilePage() {
  const { username } = useParams();
  
  const { data: profile, isLoading } = useGetPublicProfile(username || '', {
    query: { enabled: !!username, queryKey: getGetPublicProfileQueryKey(username || '') }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-64 bg-muted animate-pulse" />
        <div className="container mx-auto px-4 -mt-16 space-y-6">
          <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-6 md:grid-cols-3 mt-8">
            <Skeleton className="h-96 md:col-span-1 rounded-xl" />
            <Skeleton className="h-96 md:col-span-2 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground mb-8">The developer "{username}" does not exist or has not made their profile public.</p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    );
  }

  const gh = profile.githubProfile;

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Banner/Hero */}
      <div className="h-48 md:h-64 bg-primary/5 bg-grid-pattern relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl -mt-16 sm:-mt-20 relative z-10 space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-background shadow-xl bg-muted">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="text-4xl">{profile.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="pb-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{profile.name}</h1>
              <div className="text-lg text-muted-foreground font-mono mt-1">@{profile.username}</div>
            </div>
          </div>
          
          <div className="flex gap-3 pb-2">
            <Card className="bg-background shadow-sm border-primary/20">
              <CardContent className="p-3 px-6 flex flex-col items-center justify-center min-w-[120px]">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">SkillScore</div>
                <div className="text-3xl font-black text-primary">{profile.overallScore}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bio & Details */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {profile.location && (
            <div className="flex items-center gap-1.5 bg-background border px-3 py-1.5 rounded-full shadow-sm">
              <MapPin className="h-4 w-4" /> {profile.location}
            </div>
          )}
          {profile.college && (
            <div className="flex items-center gap-1.5 bg-background border px-3 py-1.5 rounded-full shadow-sm">
              <GraduationCap className="h-4 w-4" /> {profile.college}
            </div>
          )}
          {gh && (
            <a href={`https://github.com/${gh.username}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-background border px-3 py-1.5 rounded-full shadow-sm hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer">
              <Github className="h-4 w-4" /> {gh.username}
            </a>
          )}
        </div>
        
        {profile.bio && (
          <p className="text-lg max-w-3xl leading-relaxed">{profile.bio}</p>
        )}

        <div className="grid gap-6 md:grid-cols-3 pt-4">
          {/* Left Column - Stats & Skills */}
          <div className="md:col-span-1 space-y-6">
            {gh ? (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">GitHub Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Repositories</span>
                    <span className="font-semibold">{gh.totalRepos}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Stars</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-500">{gh.stars}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Contributions (Yr)</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-500">{gh.commits}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Followers</span>
                    <span className="font-semibold">{gh.followers}</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  GitHub not connected.
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Verified Skills</CardTitle>
                <CardDescription>Extracted from code history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.skills?.slice(0, 8).map(skill => (
                    <div key={skill.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium flex items-center gap-1.5">
                          {skill.confidence === 'high' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                          {skill.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{skill.score}/100</span>
                      </div>
                      <Progress value={skill.score} className="h-1.5" indicatorClassName={skill.color || 'bg-primary'} />
                    </div>
                  ))}
                  {(!profile.skills || profile.skills.length === 0) && (
                    <div className="text-sm text-muted-foreground text-center py-2">No skills verified yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {profile.badges && profile.badges.length > 0 && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.badges.map(badge => (
                      <div key={badge.id} className="h-12 w-12 rounded-full bg-muted border flex items-center justify-center text-2xl" title={badge.name}>
                        {badge.icon}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Projects & Coding Profiles */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FolderGit2 className="h-6 w-6 text-primary" /> Top Projects
            </h2>
            
            {profile.projects && profile.projects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.projects.slice(0, 4).map(project => (
                  <Card key={project.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base line-clamp-1 text-primary">
                          {project.htmlUrl ? (
                            <a href={project.htmlUrl} target="_blank" rel="noreferrer" className="hover:underline">{project.name}</a>
                          ) : project.name}
                        </CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2 h-10 mt-1">
                        {project.description || "No description provided."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3 flex-1">
                      <div className="flex flex-wrap gap-1.5">
                        {project.language && <Badge variant="secondary" className="text-xs bg-muted">{project.language}</Badge>}
                        {project.techStack?.slice(0, 2).map(tech => (
                          <Badge key={tech} variant="outline" className="text-xs font-normal">{tech}</Badge>
                        ))}
                      </div>
                    </CardContent>
                    <div className="border-t px-6 py-3 bg-muted/10 flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                      <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" /> {project.stars}</span>
                      <span className="flex items-center gap-1"><GitFork className="h-3.5 w-3.5" /> {project.difficulty}</span>
                      <span className="ml-auto font-medium text-foreground">Score: {project.score}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center text-muted-foreground border-dashed bg-muted/10">
                No featured projects available.
              </Card>
            )}

            {profile.codingProfiles && profile.codingProfiles.length > 0 && (
              <>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 mt-8">
                  <Code2 className="h-6 w-6 text-primary" /> Competitive Coding
                </h2>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  {profile.codingProfiles.map(cp => (
                    <Card key={cp.id}>
                      <CardContent className="p-5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold capitalize text-base">{cp.platform}</div>
                          <div className="text-sm text-muted-foreground font-mono">{cp.username}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">{cp.problemsSolved}</div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Solved</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
