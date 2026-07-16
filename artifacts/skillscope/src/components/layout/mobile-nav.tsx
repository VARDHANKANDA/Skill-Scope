import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Github,
  Code2,
  BrainCircuit,
  FolderGit2,
  FileText,
  MessageSquare,
  Map,
  Sparkles,
  Trophy,
  Users,
  User,
  Settings,
  Menu,
} from 'lucide-react';
import { useGetMe } from '@workspace/api-client-react';

const routes = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/github', label: 'GitHub Intelligence', icon: Github },
  { href: '/coding', label: 'Competitive Coding', icon: Code2 },
  { href: '/skills', label: 'Skill Matrix', icon: BrainCircuit },
  { href: '/projects', label: 'Projects', icon: FolderGit2 },
  { href: '/resume', label: 'Resume Builder', icon: FileText },
  { href: '/interview', label: 'Interview Prep', icon: MessageSquare },
  { href: '/roadmap', label: 'Learning Roadmap', icon: Map },
  { href: '/career-coach', label: 'AI Coach', icon: Sparkles },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const isRecruiter = user?.role === 'recruiter';

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
    const active = location === href;
    return (
      <Link href={href}>
        <span
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer",
            active
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              : "text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </span>
      </Link>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 flex flex-col">
        <SheetHeader className="h-14 flex flex-row items-center border-b px-4 shrink-0">
          <SheetTitle className="flex items-center gap-2 font-bold tracking-tight text-base">
            <img src="/logo.svg" alt="SkillScope" className="h-6 w-6" />
            SkillScope
          </SheetTitle>
        </SheetHeader>

        {/* Main nav */}
        <nav className="flex-1 overflow-auto grid gap-1 p-2 pt-4 content-start">
          {routes.map((route) => (
            <NavLink key={route.href} {...route} />
          ))}
          {isRecruiter && (
            <>
              <div className="my-2 border-t" />
              <NavLink href="/recruiter" label="Recruiter View" icon={Users} />
            </>
          )}
        </nav>

        {/* Bottom: Profile & Settings */}
        <div className="border-t p-2 pb-4">
          <nav className="grid gap-1">
            <NavLink href="/account/profile" label="My Profile" icon={User} />
            <NavLink href="/account/settings" label="Settings" icon={Settings} />
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
