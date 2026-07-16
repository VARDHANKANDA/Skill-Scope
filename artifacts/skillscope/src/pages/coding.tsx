import {
  useGetCodingProfiles,
  useGetCodingAggregate,
  useAddCodingProfile,
  useDeleteCodingProfile,
  getGetCodingProfilesQueryKey,
  getGetCodingAggregateQueryKey,
  type CodingProfileInputPlatform,
} from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Code2, Trophy, Flame, Target, Plus, Trash2, Search, CheckCircle2, ExternalLink } from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  SiLeetcode,
  SiCodeforces,
  SiCodechef,
  SiHackerrank,
  SiGeeksforgeeks,
  SiHackerearth,
} from 'react-icons/si';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

/* ── Platform registry ───────────────────────────────────────── */
const PLATFORMS: {
  id: CodingProfileInputPlatform;
  label: string;
  Icon: React.ElementType;
  color: string;
  iconColor: string;
  url: string;
}[] = [
  {
    id: 'leetcode',
    label: 'LeetCode',
    Icon: SiLeetcode,
    color: 'border-[#FFA116]/40 bg-[#FFA116]/8 hover:border-[#FFA116]/70 hover:bg-[#FFA116]/12',
    iconColor: 'text-[#FFA116]',
    url: 'https://leetcode.com',
  },
  {
    id: 'codeforces',
    label: 'Codeforces',
    Icon: SiCodeforces,
    color: 'border-[#1F8ACB]/40 bg-[#1F8ACB]/8 hover:border-[#1F8ACB]/70 hover:bg-[#1F8ACB]/12',
    iconColor: 'text-[#1F8ACB]',
    url: 'https://codeforces.com',
  },
  {
    id: 'codechef',
    label: 'CodeChef',
    Icon: SiCodechef,
    color: 'border-amber-700/40 bg-amber-700/8 hover:border-amber-700/70 hover:bg-amber-700/12',
    iconColor: 'text-amber-600 dark:text-amber-400',
    url: 'https://codechef.com',
  },
  {
    id: 'hackerrank',
    label: 'HackerRank',
    Icon: SiHackerrank,
    color: 'border-[#2EC866]/40 bg-[#2EC866]/8 hover:border-[#2EC866]/70 hover:bg-[#2EC866]/12',
    iconColor: 'text-[#2EC866]',
    url: 'https://hackerrank.com',
  },
  {
    id: 'geeksforgeeks',
    label: 'GeeksForGeeks',
    Icon: SiGeeksforgeeks,
    color: 'border-[#2F8D46]/40 bg-[#2F8D46]/8 hover:border-[#2F8D46]/70 hover:bg-[#2F8D46]/12',
    iconColor: 'text-[#2F8D46]',
    url: 'https://geeksforgeeks.org',
  },
  {
    id: 'atcoder',
    label: 'AtCoder',
    Icon: Code2,
    color: 'border-border/60 bg-muted/30 hover:border-border hover:bg-muted/50',
    iconColor: 'text-muted-foreground',
    url: 'https://atcoder.jp',
  },
];

/* ── Display-only helpers (for profile cards) ────────────────── */
const PLATFORM_ICON_MAP: Record<string, React.ElementType> = {
  leetcode: SiLeetcode,
  codeforces: SiCodeforces,
  codechef: SiCodechef,
  hackerrank: SiHackerrank,
  geeksforgeeks: SiGeeksforgeeks,
  hackerearth: SiHackerearth,
  atcoder: Code2,
};

const PLATFORM_COLORS: Record<string, string> = {
  leetcode: 'text-[#FFA116] bg-[#FFA116]/10',
  codeforces: 'text-[#1F8ACB] bg-[#1F8ACB]/10',
  codechef: 'text-amber-600 bg-amber-700/10',
  hackerrank: 'text-[#2EC866] bg-[#2EC866]/10',
  geeksforgeeks: 'text-[#2F8D46] bg-[#2F8D46]/10',
  hackerearth: 'text-[#2C3454] bg-[#2C3454]/10',
  atcoder: 'text-foreground bg-muted',
};

/* ── Platform Picker (grid of cards) ─────────────────────────── */
function PlatformPicker({
  selected,
  onSelect,
  connected,
}: {
  selected: CodingProfileInputPlatform | null;
  onSelect: (p: CodingProfileInputPlatform) => void;
  connected: string[];
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      PLATFORMS.filter((p) =>
        p.label.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search platforms…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 h-8 text-sm"
          autoComplete="off"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No platforms match "{query}"</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filtered.map((p) => {
            const isSelected = selected === p.id;
            const isConnected = connected.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                disabled={isConnected}
                onClick={() => onSelect(p.id)}
                className={cn(
                  'group relative flex flex-col items-center gap-2.5 rounded-xl border p-3.5 text-center',
                  'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isConnected
                    ? 'opacity-40 cursor-not-allowed border-border/30 bg-muted/10'
                    : isSelected
                    ? `${p.color} ring-2 ring-primary/50 scale-[1.03] shadow-sm`
                    : `${p.color} cursor-pointer`,
                )}
                aria-pressed={isSelected}
              >
                {/* Connected badge */}
                {isConnected && (
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none">
                    Added
                  </span>
                )}

                {/* Selected checkmark */}
                {isSelected && !isConnected && (
                  <CheckCircle2 className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-primary" />
                )}

                <p.Icon className={cn('h-7 w-7 transition-transform duration-150 group-hover:scale-110', p.iconColor)} />
                <span className="text-xs font-semibold leading-tight">{p.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Add Profile Dialog ───────────────────────────────────────── */
function AddProfileDialog({
  open,
  onOpenChange,
  connectedIds,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  connectedIds: string[];
}) {
  const addProfile = useAddCodingProfile();
  const queryClient = useQueryClient();

  const [platform, setPlatform] = useState<CodingProfileInputPlatform | null>(null);
  const [username, setUsername] = useState('');

  const selectedMeta = PLATFORMS.find((p) => p.id === platform);

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation completes
    setTimeout(() => {
      setPlatform(null);
      setUsername('');
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !platform) return;

    addProfile.mutate(
      { data: { platform, username: username.trim() } },
      {
        onSuccess: () => {
          handleClose();
          queryClient.invalidateQueries({ queryKey: getGetCodingProfilesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCodingAggregateQueryKey() });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Coding Platform</DialogTitle>
          <DialogDescription>
            Connect a competitive programming platform to start tracking your stats.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Step 1 — platform picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Choose a platform</label>
            <PlatformPicker
              selected={platform}
              onSelect={setPlatform}
              connected={connectedIds}
            />
          </div>

          {/* Step 2 — username (revealed when platform selected) */}
          <div
            className={cn(
              'space-y-2 overflow-hidden transition-all duration-200',
              platform ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0',
            )}
          >
            <label className="text-sm font-medium flex items-center gap-2">
              {selectedMeta && (
                <selectedMeta.Icon className={cn('h-3.5 w-3.5', selectedMeta.iconColor)} />
              )}
              Your {selectedMeta?.label ?? 'platform'} username
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. tourist, neetcode, gfg_user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                disabled={!platform}
              />
              {selectedMeta && (
                <a
                  href={selectedMeta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={-1}
                  title={`Open ${selectedMeta.label}`}
                >
                  <Button type="button" variant="outline" size="icon" className="shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!platform || !username.trim() || addProfile.isPending}
            >
              {addProfile.isPending ? 'Adding…' : 'Add Platform'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main page ───────────────────────────────────────────────── */
export default function CodingPage() {
  const { data: profiles, isLoading: profilesLoading } = useGetCodingProfiles();
  const { data: aggregate, isLoading: aggregateLoading } = useGetCodingAggregate();
  const deleteProfile = useDeleteCodingProfile();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const connectedIds = (profiles ?? []).map((p) => p.platform);

  const handleConfirmDelete = () => {
    if (deleteId === null) return;
    deleteProfile.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          setDeleteId(null);
          queryClient.invalidateQueries({ queryKey: getGetCodingProfilesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCodingAggregateQueryKey() });
        },
      },
    );
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Delete confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the platform from your SkillScope account. Your data on the original platform is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProfile.isPending ? 'Removing…' : 'Remove Profile'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add dialog */}
      <AddProfileDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        connectedIds={connectedIds}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitive Coding</h1>
          <p className="text-muted-foreground">
            Track your problem-solving progress across different platforms.
          </p>
        </div>
        <Button className="shrink-0" onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Platform
        </Button>
      </div>

      {/* Aggregate stats */}
      {aggregateLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : aggregate && profiles && profiles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Solved</CardTitle>
              <Code2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregate.totalProblemsSolved}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-emerald-500 font-medium">Easy: {aggregate.easyCount}</span>
                <span className="text-amber-500 font-medium">Med: {aggregate.mediumCount}</span>
                <span className="text-red-500 font-medium">Hard: {aggregate.hardCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(aggregate.averageRating)}</div>
              <p className="text-xs text-muted-foreground mt-1">Across rated platforms</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregate.longestStreak} days</div>
              <p className="text-xs text-muted-foreground mt-1">Consistency is key</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Badges</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregate.totalBadges}</div>
              <p className="text-xs text-muted-foreground mt-1">Earned achievements</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Connected Profiles */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Connected Profiles</h2>

        {profilesLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : profiles && profiles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => {
              const Icon = PLATFORM_ICON_MAP[profile.platform] ?? Code2;
              const colorClass = PLATFORM_COLORS[profile.platform] ?? 'text-foreground bg-muted';

              return (
                <Card key={profile.id} className="flex flex-col relative overflow-hidden group">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(profile.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg capitalize">{profile.platform}</CardTitle>
                        <CardDescription className="font-mono text-xs">{profile.username}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pb-4">
                    <div className="mt-2 space-y-3">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm text-muted-foreground">Problems Solved</p>
                          <p className="text-2xl font-bold">{profile.problemsSolved}</p>
                        </div>
                        {profile.rating && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Rating</p>
                            <Badge variant="outline" className="font-mono">{profile.rating}</Badge>
                          </div>
                        )}
                      </div>

                      {profile.easyCount !== undefined && profile.mediumCount !== undefined && (
                        <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{ width: `${((profile.easyCount ?? 0) / Math.max(profile.problemsSolved || 1, 1)) * 100}%` }}
                          />
                          <div
                            className="bg-amber-500 h-full"
                            style={{ width: `${((profile.mediumCount ?? 0) / Math.max(profile.problemsSolved || 1, 1)) * 100}%` }}
                          />
                          <div
                            className="bg-red-500 h-full"
                            style={{ width: `${((profile.hardCount ?? 0) / Math.max(profile.problemsSolved || 1, 1)) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                  {profile.rank && (
                    <CardFooter className="pt-0 border-t bg-muted/20 px-6 py-3 mt-auto">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        Rank: <span className="capitalize">{profile.rank}</span>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed bg-muted/10">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Code2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">No profiles connected</h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
              Connect your LeetCode, Codeforces, or other platforms to start tracking your competitive programming journey.
            </p>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Your First Platform
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
