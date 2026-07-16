import { useUser, useClerk } from '@clerk/react';
import { useGetMe } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, ExternalLink, ChevronDown, Sun, Moon, Monitor } from 'lucide-react';
import { Link } from 'wouter';
import MobileNav from './mobile-nav';
import { useTheme } from '@/contexts/theme-context';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Switch to {isDark ? 'light' : 'dark'} mode
      </TooltipContent>
    </Tooltip>
  );
}

export default function Header() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: me, isLoading } = useGetMe();

  const displayName = me?.name || user?.fullName || 'Developer';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-2">
        <MobileNav />
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />

        {isLoading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open user menu"
              >
                {/* Avatar */}
                <div className="h-8 w-8 overflow-hidden rounded-full border bg-muted shrink-0 flex items-center justify-center">
                  {user?.imageUrl
                    ? <img src={user.imageUrl} alt={displayName} className="h-full w-full object-cover" />
                    : <span className="text-xs font-bold text-muted-foreground">{initials}</span>
                  }
                </div>

                {/* Name + level — hidden on small screens */}
                <div className="hidden md:flex flex-col items-start leading-none">
                  <span className="font-semibold text-sm">{displayName}</span>
                  <span className="text-[11px] text-muted-foreground">Level {me?.level ?? 1} Developer</span>
                </div>

                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal pb-2">
                <div className="flex flex-col gap-0.5">
                  <p className="font-semibold text-sm truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.primaryEmailAddress?.emailAddress ?? ''}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <Link href="/account/profile">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <User className="h-4 w-4" /> My Profile
                </DropdownMenuItem>
              </Link>

              <Link href="/account/settings">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" /> Settings
                </DropdownMenuItem>
              </Link>

              {me?.username && (
                <Link href={`/profile/${me.username}`}>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <ExternalLink className="h-4 w-4" /> Public Profile
                  </DropdownMenuItem>
                </Link>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
