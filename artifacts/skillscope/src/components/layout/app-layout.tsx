import { useEffect, useState } from 'react';
import { useSyncUser } from '@workspace/api-client-react';
import Sidebar from './sidebar';
import Header from './header';
import { Button } from '@/components/ui/button';

// Track if we have completed a successful JIT sync once in this browser session.
let hasSyncedOnce = false;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const syncUser = useSyncUser();
  const [isSynced, setIsSynced] = useState(hasSyncedOnce);

  useEffect(() => {
    if (!hasSyncedOnce) {
      syncUser.mutate(undefined, {
        onSuccess: () => {
          hasSyncedOnce = true;
          setIsSynced(true);
        }
      });
    } else {
      // In the background, run sync silently (no blocking)
      syncUser.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isSynced) {
    if (syncUser.isError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0F1C] px-4">
          <div className="max-w-md w-full bg-[#161E31] border border-white/10 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-foreground">Syncing Failed</h2>
            <p className="text-sm text-muted-foreground">
              We couldn't synchronize your login session. Please try again.
            </p>
            <Button 
              className="w-full" 
              onClick={() => {
                syncUser.mutate(undefined, {
                  onSuccess: () => {
                    hasSyncedOnce = true;
                    setIsSynced(true);
                  }
                });
              }}
              disabled={syncUser.isPending}
            >
              {syncUser.isPending ? 'Syncing...' : 'Retry Session Sync'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0F1C] px-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground text-sm font-medium">Syncing profile session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-muted/20">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
