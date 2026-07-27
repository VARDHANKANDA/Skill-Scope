import { UserProfile } from '@clerk/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function ClerkProfilePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6 max-w-4xl">
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
          <h1 className="text-3xl font-bold tracking-tight">Security & Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your Clerk sign-in credentials, 2FA, and authentication sessions.</p>
        </div>
      </div>

      <div className="border border-white/10 rounded-2xl overflow-hidden bg-card shadow-lg p-1 min-h-[600px] flex justify-center">
        <UserProfile routing="hash" />
      </div>
    </div>
  );
}
