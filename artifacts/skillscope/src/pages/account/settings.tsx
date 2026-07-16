import { useState } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { useGetMe } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Shield, Bell, Lock, Globe, LogOut, Trash2, User,
  Mail, ExternalLink, Smartphone, Key, Eye,
  CheckCircle2, Sun, Moon, Monitor, Palette,
} from 'lucide-react';
import { Link } from 'wouter';
import { useTheme, type Theme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils';

/* ── Sub-components ─────────────────────────────────────────── */

function TabNav() {
  const tabs = [
    { value: 'account',     label: 'Account',     icon: User     },
    { value: 'appearance',  label: 'Appearance',  icon: Palette  },
    { value: 'security',    label: 'Security',    icon: Lock     },
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'privacy',     label: 'Privacy',     icon: Eye      },
  ];
  return (
    <TabsList className="h-auto flex-wrap gap-1 bg-muted/50 p-1">
      {tabs.map((t) => (
        <TabsTrigger key={t.value} value={t.value} className="gap-2 text-sm">
          <t.icon className="h-3.5 w-3.5" />
          {t.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

function RowItem({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{value}</span>
        {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
      </div>
    </div>
  );
}

function NotifRow({ label, description, defaultOn = true }: { label: string; description: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-start justify-between py-4 border-b last:border-0 gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={on} onCheckedChange={setOn} />
    </div>
  );
}

function PrivacyRow({ label, description, defaultOn = true }: { label: string; description: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-start justify-between py-4 border-b last:border-0 gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={on} onCheckedChange={setOn} />
    </div>
  );
}

const THEME_OPTIONS: { value: Theme; label: string; description: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light',  label: 'Light',  description: 'Clean white interface for daylight use.', Icon: Sun     },
  { value: 'dark',   label: 'Dark',   description: 'Dark developer theme — easy on the eyes.', Icon: Moon   },
  { value: 'system', label: 'System', description: 'Follows your OS preference automatically.', Icon: Monitor },
];

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" /> Theme
          </CardTitle>
          <CardDescription>
            Choose how SkillScope looks for you. Your preference is saved locally.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEME_OPTIONS.map(({ value, label, description, Icon }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all hover:border-primary/60 hover:bg-accent/40',
                    active
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-card',
                  )}
                >
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                    active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground',
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={cn('text-sm font-semibold', active && 'text-primary')}>{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
                  </div>
                  {active && (
                    <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */

export default function SettingsPage() {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { data: me } = useGetMe();

  return (
    <div className="space-y-8 pb-12 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and privacy.</p>
      </div>

      <Tabs defaultValue="account">
        <TabNav />

        {/* ── Account ── */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Account Information
              </CardTitle>
              <CardDescription>Your core account details managed by Clerk.</CardDescription>
            </CardHeader>
            <CardContent>
              <RowItem label="Full name" value={me?.name ?? clerkUser?.fullName ?? '—'} />
              <RowItem label="Email address" value={clerkUser?.primaryEmailAddress?.emailAddress ?? '—'} badge="Verified" />
              <RowItem label="Username" value={me?.username ?? '—'} />
              <RowItem label="Role" value={(me?.role ?? 'student').charAt(0).toUpperCase() + (me?.role ?? 'student').slice(1)} />
              <RowItem label="Member since" value={me?.createdAt ? new Date(me.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Edit Profile
              </CardTitle>
              <CardDescription>Change your name, bio, location, and other profile details.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/account/profile">
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" /> Go to Profile Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <Trash2 className="h-4 w-4" /> Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions. Proceed with caution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <LogOut className="h-4 w-4" /> Sign Out of All Devices
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign out everywhere?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be signed out of all active sessions across all devices. You'll need to sign in again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => signOut()}
                    >
                      Sign Out Everywhere
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-xs text-muted-foreground">
                To permanently delete your account, please contact us at support@skillscope.in.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Appearance ── */}
        <TabsContent value="appearance" className="mt-6">
          <AppearanceTab />
        </TabsContent>

        {/* ── Security ── */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4" /> Password
              </CardTitle>
              <CardDescription>Your password is managed securely via Clerk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <p className="text-sm text-muted-foreground">Password is set and secure.</p>
              </div>
              <a href="https://accounts.clerk.dev/user/security" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" /> Change Password on Clerk
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <a href="https://accounts.clerk.dev/user/security" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" /> Manage 2FA on Clerk
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email Address
              </CardTitle>
              <CardDescription>Your verified email addresses and how to update them.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {clerkUser?.emailAddresses.map((ea) => (
                <div key={ea.id} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{ea.emailAddress}</span>
                  <Badge variant="secondary" className="text-[10px]">Verified</Badge>
                </div>
              ))}
              <a href="https://accounts.clerk.dev/user" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" /> Manage Emails on Clerk
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" /> Active Sessions
              </CardTitle>
              <CardDescription>Manage where you're signed in.</CardDescription>
            </CardHeader>
            <CardContent>
              <a href="https://accounts.clerk.dev/user/security" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" /> View Active Sessions
                </Button>
              </a>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notification Preferences
              </CardTitle>
              <CardDescription>Choose which notifications you'd like to receive.</CardDescription>
            </CardHeader>
            <CardContent>
              <NotifRow label="Leaderboard rank changes" description="Get notified when your rank changes on the public leaderboard." defaultOn={true} />
              <NotifRow label="Goal completion reminders" description="Daily reminders to complete your learning roadmap goals." defaultOn={true} />
              <NotifRow label="Recruiter profile views" description="Know when a recruiter views your public profile." defaultOn={true} />
              <NotifRow label="New coding contest alerts" description="Upcoming contests on LeetCode, Codeforces, and CodeChef." defaultOn={false} />
              <NotifRow label="Weekly progress digest" description="A weekly summary of your skill growth and activity." defaultOn={true} />
              <NotifRow label="Platform announcements" description="Important updates and new features from SkillScope." defaultOn={true} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Privacy ── */}
        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" /> Privacy Settings
              </CardTitle>
              <CardDescription>Control what others can see on your public profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <PrivacyRow label="Public profile visible" description="Allow recruiters and other developers to view your public profile page." defaultOn={true} />
              <PrivacyRow label="Show on leaderboard" description="Display your name and score on the public developer leaderboard." defaultOn={true} />
              <PrivacyRow label="Show GitHub activity" description="Display your GitHub contributions and repos on your public profile." defaultOn={true} />
              <PrivacyRow label="Show coding scores" description="Make your LeetCode, Codeforces, and other platform scores visible." defaultOn={true} />
              <PrivacyRow label="Show college information" description="Display your college and graduation year on your profile." defaultOn={true} />
              <PrivacyRow label="Allow recruiter bookmarking" description="Let verified recruiters bookmark your profile for hiring pipelines." defaultOn={true} />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Data &amp; Privacy</CardTitle>
              <CardDescription>Your data rights and controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                SkillScope only reads publicly available data from platforms you link. We never store your passwords or private repositories.
              </p>
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" /> View Privacy Policy
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sign out */}
      <div className="pt-4 border-t">
        <Button
          variant="ghost"
          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
