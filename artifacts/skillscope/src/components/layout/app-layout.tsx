import { useEffect } from 'react';
import { useSyncUser } from '@workspace/api-client-react';
import Sidebar from './sidebar';
import Header from './header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const syncUser = useSyncUser();

  useEffect(() => {
    syncUser.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
