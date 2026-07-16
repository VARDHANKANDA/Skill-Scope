import { useEffect, useRef } from 'react';
import { ThemeProvider } from '@/contexts/theme-context';
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import LandingPage from '@/pages/landing';
import DashboardPage from '@/pages/dashboard';
import GithubPage from '@/pages/github';
import CodingPage from '@/pages/coding';
import SkillsPage from '@/pages/skills';
import ProjectsPage from '@/pages/projects';
import ProjectDetailPage from '@/pages/project-detail';
import ResumePage from '@/pages/resume';
import InterviewPage from '@/pages/interview';
import RoadmapPage from '@/pages/roadmap';
import CareerCoachPage from '@/pages/career-coach';
import LeaderboardPage from '@/pages/leaderboard';
import RecruiterPage from '@/pages/recruiter';
import PublicProfilePage from '@/pages/public-profile';

import ProfilePage from '@/pages/account/profile';
import SettingsPage from '@/pages/account/settings';
import AppLayout from '@/components/layout/app-layout';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#00E5FF",
    colorForeground: "#F8FAFC",
    colorMutedForeground: "hsl(210 18% 55%)",
    colorDanger: "hsl(0 70% 50%)",
    colorBackground: "#0A0F1C",
    colorInput: "#161E31",
    colorInputForeground: "#F8FAFC",
    colorNeutral: "#161E31",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#161E31] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl border border-white/10",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-xl font-bold tracking-tight text-foreground",
    headerSubtitle: "text-sm text-muted-foreground",
    socialButtonsBlockButtonText: "text-sm font-medium",
    formFieldLabel: "text-sm font-medium text-foreground",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground text-xs uppercase tracking-wider",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-emerald-600",
    alertText: "text-sm font-medium",
    logoBox: "mb-6 flex justify-center",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border-input hover:bg-accent transition-colors",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-9",
    formFieldInput: "border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    footerAction: "bg-muted/50 rounded-b-2xl py-4",
    dividerLine: "bg-border",
    alert: "rounded-lg border",
    otpCodeFieldInput: "border-input text-lg",
    formFieldRow: "mb-4",
    main: "px-8 py-6",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);
  return null;
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 px-4 bg-grid-pattern relative">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]" />
      <div className="relative z-10">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 px-4 bg-grid-pattern relative">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]" />
      <div className="relative z-10">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect href="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>
          <Component />
        </AppLayout>
      </Show>
      <Show when="signed-out">
        <Redirect href="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/dashboard"><ProtectedRoute component={DashboardPage} /></Route>
            <Route path="/github"><ProtectedRoute component={GithubPage} /></Route>
            <Route path="/coding"><ProtectedRoute component={CodingPage} /></Route>
            <Route path="/skills"><ProtectedRoute component={SkillsPage} /></Route>
            <Route path="/projects"><ProtectedRoute component={ProjectsPage} /></Route>
            <Route path="/projects/:id"><ProtectedRoute component={ProjectDetailPage} /></Route>
            <Route path="/resume"><ProtectedRoute component={ResumePage} /></Route>
            <Route path="/interview"><ProtectedRoute component={InterviewPage} /></Route>
            <Route path="/roadmap"><ProtectedRoute component={RoadmapPage} /></Route>
            <Route path="/career-coach"><ProtectedRoute component={CareerCoachPage} /></Route>
            <Route path="/leaderboard"><ProtectedRoute component={LeaderboardPage} /></Route>
            <Route path="/recruiter"><ProtectedRoute component={RecruiterPage} /></Route>
            <Route path="/account/profile"><ProtectedRoute component={ProfilePage} /></Route>
            <Route path="/account/settings"><ProtectedRoute component={SettingsPage} /></Route>
            <Route path="/profile/:username" component={PublicProfilePage} />
            
            <Route>
              <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="text-muted-foreground">Page not found</p>
              </div>
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
