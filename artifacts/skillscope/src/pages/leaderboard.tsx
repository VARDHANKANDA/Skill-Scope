import { useGetLeaderboard, useGetGamificationProfile } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy, Medal, Flame,
  GitCommit, Code2, Star, Zap, Shield, BookOpen, Target,
  Award, Lock, TrendingUp, Cpu, Rocket,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from 'wouter';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/* ── Badge icon map ──────────────────────────────────────────── */
const BADGE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  GitCommit, Code2, Star, Zap, Flame, Shield, BookOpen, Target, Trophy, TrendingUp, Cpu, Rocket,
};
function BadgeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = BADGE_ICON_MAP[name] ?? Award;
  return <Icon className={className} />;
}

/* ── Rarity config ───────────────────────────────────────────── */
const RARITY: Record<string, {
  label: string;
  border: string;
  bg: string;
  iconBg: string;
  iconText: string;
  badge: string;
  glow: string;
}> = {
  common: {
    label: 'Common',
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/5',
    iconBg: 'bg-slate-500/10',
    iconText: 'text-slate-400',
    badge: 'bg-slate-700/60 text-slate-300',
    glow: '',
  },
  rare: {
    label: 'Rare',
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/5',
    iconBg: 'bg-blue-500/10',
    iconText: 'text-blue-400',
    badge: 'bg-blue-900/60 text-blue-300',
    glow: 'hover:shadow-[0_0_14px_rgba(59,130,246,0.18)]',
  },
  epic: {
    label: 'Epic',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/5',
    iconBg: 'bg-purple-500/10',
    iconText: 'text-purple-400',
    badge: 'bg-purple-900/60 text-purple-300',
    glow: 'hover:shadow-[0_0_14px_rgba(168,85,247,0.22)]',
  },
  legendary: {
    label: 'Legendary',
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/5',
    iconBg: 'bg-amber-500/10',
    iconText: 'text-amber-400',
    badge: 'bg-amber-900/60 text-amber-300',
    glow: 'hover:shadow-[0_0_18px_rgba(245,158,11,0.28)]',
  },
};

/* ── BadgeCard component ─────────────────────────────────────── */
function BadgeCard({ badge }: {
  badge: { id: number; name: string; description: string; icon: string; rarity?: string; earnedAt: string };
}) {
  const cfg = RARITY[badge.rarity ?? 'common'] ?? RARITY.common;
  const earned = new Date(badge.earnedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          'group relative flex flex-col gap-2.5 rounded-xl border p-3 cursor-default',
          'transition-all duration-200 hover:scale-[1.03]',
          cfg.border, cfg.bg, cfg.glow,
        )}>
          {/* Icon */}
          <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', cfg.iconBg)}>
            <BadgeIcon name={badge.icon} className={cn('h-4.5 w-4.5 h-[18px] w-[18px]', cfg.iconText)} />
          </div>
          {/* Name */}
          <p className="text-xs font-semibold leading-tight truncate">{badge.name}</p>
          {/* Rarity label */}
          <span className={cn('text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full w-fit', cfg.badge)}>
            {cfg.label}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[180px] text-center">
        <p className="font-semibold text-xs">{badge.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">Earned {earned}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/* ── Rank helpers ────────────────────────────────────────────── */
function getRankBadge(rank: number) {
  if (rank === 1) return 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]';
  if (rank === 2) return 'bg-slate-300 text-slate-800 border-slate-400';
  if (rank === 3) return 'bg-amber-600 text-amber-100 border-amber-700';
  return 'bg-muted text-muted-foreground';
}
function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-4 w-4" />;
  if (rank === 2) return <Medal className="h-4 w-4" />;
  if (rank === 3) return <Medal className="h-4 w-4" />;
  return <span className="font-bold text-sm">{rank}</span>;
}

/* ── Main page ───────────────────────────────────────────────── */
export default function LeaderboardPage() {
  const { data: leaderboard, isLoading: boardLoading } = useGetLeaderboard({ limit: 50 });
  const { data: profile, isLoading: profileLoading } = useGetGamificationProfile();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Leaderboard</h1>
        <p className="text-muted-foreground">
          Rank up by solving problems, contributing to open source, and building projects.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Stats Panel */}
        <div className="md:col-span-1 space-y-6">
          {/* XP & Level */}
          <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Your Status</CardTitle>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : profile ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary border-2 border-primary/30">
                        <span className="text-2xl font-black">{profile.level}</span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-0.5">
                        <div className="bg-amber-500 rounded-full p-1 text-white">
                          <Flame className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-lg">{profile.levelName}</div>
                      <div className="text-sm text-muted-foreground">{profile.xp} Total XP</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Progress to Level {profile.level + 1}</span>
                      <span>{profile.xpToNextLevel} XP needed</span>
                    </div>
                    <Progress
                      value={Math.round(((profile.xp % 500) / 500) * 100)}
                      className="h-2 bg-primary/10"
                      indicatorClassName="bg-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-500">{profile.streak || 0}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Day Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{profile.totalBadges || 0}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Badges</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">Profile data unavailable.</div>
              )}
            </CardContent>
          </Card>

          {/* Badge showcase */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Earned Badges</CardTitle>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
              ) : profile?.badges && profile.badges.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {profile.badges.slice(0, 9).map(badge => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed rounded-xl border-border/50">
                  <Lock className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No badges yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">Complete goals to earn badges!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Table */}
        <Card className="md:col-span-2 overflow-hidden flex flex-col">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Top Developers</CardTitle>
              <Badge variant="outline" className="font-normal text-xs">Updated daily</Badge>
            </div>
          </CardHeader>
          <div className="flex-1 overflow-auto">
            {boardLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="divide-y divide-border/50">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={cn(
                      'flex items-center gap-4 p-4 transition-colors hover:bg-muted/30',
                      entry.rank <= 3 && 'bg-primary/5',
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm', getRankBadge(entry.rank))}>
                      {getRankIcon(entry.rank)}
                    </div>

                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={entry.avatarUrl || undefined} />
                      <AvatarFallback>{entry.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${entry.name.toLowerCase().replace(/\s+/g, '')}`}>
                        <div className="font-semibold truncate hover:underline hover:text-primary cursor-pointer transition-colors">
                          {entry.name}
                        </div>
                      </Link>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Lvl {entry.level}</span>
                        {entry.college && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">{entry.college}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-primary">{entry.overallScore}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Trophy className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-base">Leaderboard is empty</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-xs leading-relaxed">
                  Rankings will appear automatically as users start using the platform.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
