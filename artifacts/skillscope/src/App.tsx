import { setBaseUrl } from "@workspace/api-client-react";
import { useEffect, useRef } from 'react';
import { ThemeProvider } from '@/contexts/theme-context';
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser, useSignIn, useSignUp, AuthenticateWithRedirectCallback } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect, Link } from 'wouter';
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
import ClerkProfilePage from '@/pages/account/clerk-profile';
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
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
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

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="w-5 h-5 mr-2 shrink-0" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="10.8" height="10.8" fill="#F25022" />
    <rect x="12.2" width="10.8" height="10.8" fill="#7FBA00" />
    <rect y="12.2" width="10.8" height="10.8" fill="#00A4EF" />
    <rect x="12.2" y="12.2" width="10.8" height="10.8" fill="#FFB900" />
  </svg>
);

function SignInPage() {
  const { signIn, fetchStatus } = useSignIn();
  const isLoaded = fetchStatus === 'idle';

  const handleOAuthSignIn = (strategy: "oauth_google" | "oauth_github" | "oauth_microsoft") => {
    if (!isLoaded || !signIn) return;
    signIn.sso({
      strategy,
      redirectCallbackUrl: `${window.location.origin}${basePath}/sso-callback`,
      redirectUrl: `${window.location.origin}${basePath}/dashboard`,
    });
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 px-4 bg-grid-pattern relative">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]" />
      
      <Card className="relative z-10 w-[440px] max-w-full bg-[#161E31] border-white/10 shadow-2xl rounded-2xl overflow-hidden p-6 md:p-8">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <img src={`${basePath}/logo.svg`} alt="SkillScope" className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Sign In to SkillScope
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-2">
            Choose a provider to access your developer profile
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full h-11 justify-start px-4 text-foreground bg-[#1E293B] hover:bg-[#334155] border-white/10 hover:text-foreground font-medium transition-all"
            onClick={() => handleOAuthSignIn('oauth_google')}
          >
            <GoogleIcon />
            <span className="flex-1 text-center pr-5">Continue with Google</span>
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-11 justify-start px-4 text-foreground bg-[#1E293B] hover:bg-[#334155] border-white/10 hover:text-foreground font-medium transition-all"
            onClick={() => handleOAuthSignIn('oauth_github')}
          >
            <Github className="w-5 h-5 mr-2" />
            <span className="flex-1 text-center pr-5">Continue with GitHub</span>
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-11 justify-start px-4 text-foreground bg-[#1E293B] hover:bg-[#334155] border-white/10 hover:text-foreground font-medium transition-all"
            onClick={() => handleOAuthSignIn('oauth_microsoft')}
          >
            <MicrosoftIcon />
            <span className="flex-1 text-center pr-5">Continue with Microsoft</span>
          </Button>

          <div className="text-center pt-6 border-t border-white/10 mt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/sign-up" className="text-primary hover:text-primary/90 font-medium transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SignUpPage() {
  const { signUp, fetchStatus } = useSignUp();
  const isLoaded = fetchStatus === 'idle';

  const handleOAuthSignUp = (strategy: "oauth_google" | "oauth_github" | "oauth_microsoft") => {
    if (!isLoaded || !signUp) return;
    signUp.sso({
      strategy,
      redirectCallbackUrl: `${window.location.origin}${basePath}/sso-callback`,
      redirectUrl: `${window.location.origin}${basePath}/dashboard`,
    });
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 px-4 bg-grid-pattern relative">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]" />
      
      <Card className="relative z-10 w-[440px] max-w-full bg-[#161E31] border-white/10 shadow-2xl rounded-2xl overflow-hidden p-6 md:p-8">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <img src={`${basePath}/logo.svg`} alt="SkillScope" className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-2">
            Get started with your verified developer profile
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full h-11 justify-start px-4 text-foreground bg-[#1E293B] hover:bg-[#334155] border-white/10 hover:text-foreground font-medium transition-all"
            onClick={() => handleOAuthSignUp('oauth_google')}
          >
            <GoogleIcon />
            <span className="flex-1 text-center pr-5">Sign up with Google</span>
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-11 justify-start px-4 text-foreground bg-[#1E293B] hover:bg-[#334155] border-white/10 hover:text-foreground font-medium transition-all"
            onClick={() => handleOAuthSignUp('oauth_github')}
          >
            <Github className="w-5 h-5 mr-2" />
            <span className="flex-1 text-center pr-5">Sign up with GitHub</span>
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-11 justify-start px-4 text-foreground bg-[#1E293B] hover:bg-[#334155] border-white/10 hover:text-foreground font-medium transition-all"
            onClick={() => handleOAuthSignUp('oauth_microsoft')}
          >
            <MicrosoftIcon />
            <span className="flex-1 text-center pr-5">Sign up with Microsoft</span>
          </Button>

          <div className="text-center pt-6 border-t border-white/10 mt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-primary hover:text-primary/90 font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SSOCallbackPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0A0F1C] px-4">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground text-sm">Completing authentication...</p>
        <AuthenticateWithRedirectCallback />
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
            <Route path="/sso-callback" component={SSOCallbackPage} />
            
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
            <Route path="/account/manage-clerk"><ProtectedRoute component={ClerkProfilePage} /></Route>
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
setBaseUrl(import.meta.env.VITE_API_URL ?? null);
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
