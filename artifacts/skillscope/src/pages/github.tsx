import { 
  useGetGithubProfile, 
  useGetGithubRepos, 
  useGetGithubLanguages, 
  useGetCommitActivity,
  useConnectGithub,
  useDisconnectGithub
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Github, Star, GitFork, GitCommit, GitPullRequest, CircleDot } from 'lucide-react';
import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { getGetGithubProfileQueryKey, getGetGithubReposQueryKey, getGetGithubLanguagesQueryKey, getGetCommitActivityQueryKey } from '@workspace/api-client-react';

export default function GithubPage() {
  const { data: profile, isLoading: profileLoading } = useGetGithubProfile();
  const { data: repos, isLoading: reposLoading } = useGetGithubRepos();
  const { data: languages, isLoading: languagesLoading } = useGetGithubLanguages();
  const { data: activity, isLoading: activityLoading } = useGetCommitActivity();
  
  const connectGithub = useConnectGithub();
  const disconnectGithub = useDisconnectGithub();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [username, setUsername] = useState('');

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    connectGithub.mutate({ data: { username } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGithubProfileQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGithubReposQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGithubLanguagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCommitActivityQueryKey() });
        toast({
          title: "Success",
          description: "GitHub profile connected successfully!",
        });
      },
      onError: (err: any) => {
        const errMsg = err?.response?.data?.error || err?.message || "Failed to connect to GitHub. Verify username and try again.";
        toast({
          title: "Connection Failed",
          description: errMsg,
          variant: "destructive",
        });
      }
    });
  };

  const handleDisconnect = () => {
    disconnectGithub.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGithubProfileQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGithubReposQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGithubLanguagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCommitActivityQueryKey() });
        toast({
          title: "Success",
          description: "GitHub profile disconnected successfully.",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Error",
          description: err?.message || "Failed to disconnect GitHub profile.",
          variant: "destructive",
        });
      }
    });
  };

  if (profileLoading) {
    return <div className="space-y-6">
      <Skeleton className="h-8 w-64 mb-4" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[400px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    </div>;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 max-w-md mx-auto text-center">
        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center">
          <Github className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Connect your GitHub</h2>
          <p className="text-muted-foreground">
            Link your GitHub account to analyze your code quality, calculate your open source impact, and generate intelligent insights.
          </p>
        </div>
        <form onSubmit={handleConnect} className="flex w-full gap-2">
          <Input 
            placeholder="GitHub Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            disabled={connectGithub.isPending}
          />
          <Button type="submit" disabled={connectGithub.isPending}>
            {connectGithub.isPending ? "Connecting..." : "Connect"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GitHub Intelligence</h1>
          <p className="text-muted-foreground">
            Analysis of your open source contributions and code patterns.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="font-semibold">{profile.username}</div>
            <div className="text-sm text-muted-foreground">GitHub Score: {profile.score}/100</div>
          </div>
          <div className="h-12 w-12 rounded-full overflow-hidden border">
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.username} className="h-full w-full object-cover" /> : <Github className="h-full w-full p-2 bg-muted text-muted-foreground" />}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDisconnect}
            disabled={disconnectGithub.isPending}
            className="text-destructive hover:bg-destructive/10"
          >
            {disconnectGithub.isPending ? "Disconnecting..." : "Disconnect"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
            <FolderGit2Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.totalRepos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Stars</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stars}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commits (Last Year)</CardTitle>
            <GitCommit className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.commits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
            <GitPullRequest className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.pullRequests}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
            <CardDescription>Primary languages across all public repositories</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {languagesLoading ? (
              <Skeleton className="h-[250px] w-full rounded-full" />
            ) : languages && languages.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={languages}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="percentage"
                      nameKey="language"
                    >
                      {languages.map((entry) => (
                        <Cell key={entry.language} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, '']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {languages.slice(0, 5).map((lang) => (
                    <div key={lang.language} className="flex items-center gap-1.5 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lang.color }} />
                      <span>{lang.language}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">No language data found</div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Commit Activity</CardTitle>
            <CardDescription>Weekly commits over the last year</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {activityLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : activity && activity.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activity} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="week" 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value, i) => i % 4 === 0 ? value : ''}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="commits" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">No activity data found</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Repositories</CardTitle>
          <CardDescription>Your highest-impact open source work</CardDescription>
        </CardHeader>
        <CardContent>
          {reposLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : repos && repos.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {repos.slice(0, 6).map((repo) => (
                <div key={repo.id} className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
                  <div>
                    <div className="flex items-start justify-between">
                      <a href={repo.htmlUrl || '#'} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline line-clamp-1">
                        {repo.name}
                      </a>
                      <Badge variant="outline" className="shrink-0">{repo.isPrivate ? 'Private' : 'Public'}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    {repo.language && (
                      <div className="flex items-center gap-1">
                        <CircleDot className="h-3 w-3 text-blue-500" />
                        <span>{repo.language}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span>{repo.stars}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="h-3 w-3" />
                      <span>{repo.forks}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">No public repositories found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Temporary icon to avoid lucide-react import issues if it's not exported as such
function FolderGit2Icon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5" />
      <circle cx="13" cy="13" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="M13 15v4" />
      <path d="m18 13-1.5 1.5" />
      <path d="m18 13 1.5 1.5" />
    </svg>
  );
}
