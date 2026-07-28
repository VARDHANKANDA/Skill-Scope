import { UserProfile } from '@clerk/react';
import { dark } from '@clerk/themes';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useTheme } from '@/contexts/theme-context';

export default function ClerkProfilePage() {
  const [, setLocation] = useLocation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="space-y-6 max-w-5xl w-full mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setLocation('/account/profile')}
          title="Back to profile"
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Security & Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your Clerk sign-in credentials, 2FA, and authentication sessions.</p>
        </div>
      </div>

      <div className="w-full flex justify-center mt-4">
        <UserProfile 
          routing="hash" 
          appearance={{
            theme: isDark ? dark : undefined,
            variables: {
              colorPrimary: "hsl(var(--primary))",
              colorBackground: isDark ? "hsl(var(--card))" : "hsl(var(--background))",
              colorForeground: "hsl(var(--foreground))",
              colorMutedForeground: "hsl(var(--muted-foreground))",
              colorInput: "hsl(var(--background))",
              colorInputForeground: "hsl(var(--foreground))",
              colorNeutral: "hsl(var(--border))",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              borderRadius: "0.5rem",
            },
            elements: {
              rootBox: "w-full max-w-5xl mx-auto flex justify-center",
              cardBox: "w-full bg-card rounded-2xl shadow-xl border border-border overflow-hidden min-h-[600px] !max-w-none !w-full",
              card: "!shadow-none !border-0 bg-transparent p-0 flex-1 w-full",
              navbar: "bg-[#1E293B]/20 border-r border-border p-6 md:w-64 shrink-0 flex flex-col gap-1 w-full md:block",
              navbarButton: "text-muted-foreground hover:bg-accent hover:text-foreground transition-all rounded-lg px-3 py-2 text-sm text-left w-full",
              navbarButtonActive: "bg-accent text-foreground font-semibold",
              scrollBox: "bg-transparent p-6 md:p-8 flex-1",
              pageScrollBox: "bg-transparent p-0 w-full",
              headerTitle: "text-xl font-bold text-foreground",
              headerSubtitle: "text-sm text-muted-foreground mb-4",
              profileSectionTitle: "text-lg font-semibold text-foreground border-b border-border pb-2 mb-4 mt-2",
              formFieldLabel: "text-sm font-medium text-foreground mb-1 block",
              formFieldInput: "border-input bg-background text-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-md font-medium text-sm",
              formButtonReset: "bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors px-4 py-2 rounded-md font-medium text-sm",
              userProfileButtonCard: "border border-border rounded-xl p-4 bg-background/50",
              profileSection: "mb-6 pb-6 border-b border-border/50 last:border-0 last:pb-0",
              accordionTriggerButton: "text-foreground font-medium",
            }
          }}
        />
      </div>
    </div>
  );
}

