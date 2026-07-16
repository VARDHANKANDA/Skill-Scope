import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
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

const bottomRoutes = [
  { href: '/account/profile', label: 'My Profile', icon: User },
  { href: '/account/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useGetMe();

  const isRecruiter = user?.role === 'recruiter';

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
    const active = location === href;
    return (
      <Link href={href}>
        <span className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
          active ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground"
        )}>
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </span>
      </Link>
    );
  }

  return (
    <aside className="hidden w-64 flex-col border-r bg-card md:flex">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4 shrink-0">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <img src="/logo.svg" alt="SkillScope" className="h-6 w-6" />
          <span>SkillScope</span>
        </Link>
      </div>
      
      {/* Main nav */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
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
      </div>

      {/* Bottom nav — Profile & Settings */}
      <div className="border-t py-3 px-2">
        <nav className="grid gap-1">
          {bottomRoutes.map((route) => (
            <NavLink key={route.href} {...route} />
          ))}
        </nav>
      </div>
    </aside>
  );
}
