import { 
  useSearchDevelopers, 
  useGetRecruiterBookmarks,
  useAddRecruiterBookmark,
  useRemoveRecruiterBookmark,
  type DeveloperCard
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, GraduationCap, Github, Code2, Bookmark, BookmarkCheck, ExternalLink, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { getGetRecruiterBookmarksQueryKey, getSearchDevelopersQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RecruiterPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [skills, setSkills] = useState('');
  const [minScore, setMinScore] = useState<number | undefined>(undefined);
  
  const queryParams = { 
    skills: skills || undefined, 
    minGithubScore: minScore, 
    limit: 20 
  };
  
  const { data: searchResults, isLoading: searchLoading } = useSearchDevelopers(queryParams);
  const { data: bookmarks, isLoading: bookmarksLoading } = useGetRecruiterBookmarks();
  
  const addBookmark = useAddRecruiterBookmark();
  const removeBookmark = useRemoveRecruiterBookmark();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: getSearchDevelopersQueryKey(queryParams) });
  };

  const isBookmarked = (userId: number) => {
    return bookmarks?.some(b => b.bookmarkedUserId === userId) || false;
  };

  const getBookmarkId = (userId: number) => {
    return bookmarks?.find(b => b.bookmarkedUserId === userId)?.id;
  };

  const toggleBookmark = (userId: number) => {
    if (isBookmarked(userId)) {
      const id = getBookmarkId(userId);
      if (id) {
        removeBookmark.mutate({ userId: userId.toString() }, {
          onSuccess: () => {
            toast({ title: "Removed from bookmarks" });
            queryClient.invalidateQueries({ queryKey: getGetRecruiterBookmarksQueryKey() });
          }
        });
      }
    } else {
      addBookmark.mutate({ data: { bookmarkedUserId: userId } }, {
        onSuccess: () => {
          toast({ title: "Added to bookmarks" });
          queryClient.invalidateQueries({ queryKey: getGetRecruiterBookmarksQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recruiter Dashboard</h1>
        <p className="text-muted-foreground">
          Discover top engineering talent backed by verified data.
        </p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="search">Discover Talent</TabsTrigger>
          <TabsTrigger value="bookmarks">Saved Candidates ({bookmarks?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6 m-0">
          <Card className="border-primary/20 shadow-sm bg-muted/10">
            <CardContent className="p-4">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by name or keyword..." 
                      className="pl-9 bg-background"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="relative flex-1 hidden md:block">
                    <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Required skills (e.g. React, Python)" 
                      className="pl-9 bg-background"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="md:w-auto w-full">Search Developers</Button>
              </form>
            </CardContent>
          </Card>

          {searchLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
            </div>
          ) : searchResults?.developers && searchResults.developers.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.developers.map((dev) => (
                <DeveloperCard 
                  key={dev.userId} 
                  dev={dev} 
                  isBookmarked={isBookmarked(dev.userId)} 
                  onBookmark={() => toggleBookmark(dev.userId)} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed">
              <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold">No developers found</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Try adjusting your search criteria or removing filters.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarks" className="m-0">
          {bookmarksLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
            </div>
          ) : bookmarks && bookmarks.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map((bookmark) => (
                <DeveloperCard 
                  key={bookmark.bookmarkedUserId} 
                  dev={bookmark.bookmarkedUser} 
                  isBookmarked={true} 
                  onBookmark={() => toggleBookmark(bookmark.bookmarkedUserId)} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed">
              <Bookmark className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold">No saved candidates</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Bookmark interesting developers from the search tab to keep track of them here.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DeveloperCard({ dev, isBookmarked, onBookmark }: { dev: DeveloperCard, isBookmarked: boolean, onBookmark: () => void }) {
  return (
    <Card className="flex flex-col group hover:shadow-md transition-shadow">
      <CardHeader className="pb-4 relative">
        <button 
          onClick={onBookmark}
          className={`absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
            isBookmarked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground'
          }`}
        >
          {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </button>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
            <AvatarImage src={dev.avatarUrl ?? undefined} />
            <AvatarFallback>{dev.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base line-clamp-1">{dev.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{dev.location || "Remote"}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4">
        {dev.college && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{dev.college}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-muted/50 rounded-md p-2 text-center">
            <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Overall</div>
            <div className="font-bold text-primary">{dev.overallScore}</div>
          </div>
          <div className="bg-muted/50 rounded-md p-2 text-center">
            <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">GitHub</div>
            <div className="font-bold text-emerald-600">{dev.githubScore}</div>
          </div>
          <div className="bg-muted/50 rounded-md p-2 text-center">
            <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Coding</div>
            <div className="font-bold text-blue-600">{dev.codingScore}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {dev.topSkills && dev.topSkills.length > 0 ? (
              dev.topSkills.slice(0, 4).map((skill: string) => (
                <Badge key={skill} variant="secondary" className="text-[10px] font-normal px-2 py-0">
                  {skill}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">No skills listed</span>
            )}
            {(dev.topSkills?.length || 0) > 4 && (
              <Badge variant="outline" className="text-[10px] font-normal px-2 py-0">
                +{(dev.topSkills.length) - 4}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 border-t bg-muted/10 p-4 mt-auto">
        <Link href={`/profile/${dev.username}`} className="w-full">
          <Button variant="outline" className="w-full bg-background">
            View Full Profile <ExternalLink className="ml-2 h-4 w-4 text-muted-foreground" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
