import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, Code2, BrainCircuit, Target, Trophy, 
  Github, FileText, Sparkles, CheckCircle2, Users,
  Star, TrendingUp, Zap, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';



const FEATURES = [
  {
    icon: Github,
    title: "GitHub Intelligence",
    description: "Deep analysis of your commit history, language proficiency, project quality, and open source impact — quantified into a single score.",
    badge: "AI-Powered",
  },
  {
    icon: Code2,
    title: "Competitive Coding Tracker",
    description: "Aggregate your LeetCode, Codeforces, CodeChef, and GeeksForGeeks stats. See your contest rating history and problem-solving patterns.",
    badge: "Multi-Platform",
  },
  {
    icon: BrainCircuit,
    title: "Skill Matrix",
    description: "AI extracts your true proficiency in each technology from your actual code — not self-reported. Know exactly where you stand vs. the competition.",
    badge: "Verified",
  },
  {
    icon: FileText,
    title: "ATS-Optimised Resume",
    description: "Generate role-specific resumes with real data from your profile. Tested against ATS systems used by Flipkart, Amazon, and Google.",
    badge: "One-Click",
  },
  {
    icon: Target,
    title: "Interview Readiness",
    description: "Get a predicted success probability for every target company. Know your gaps before you apply — not after you get rejected.",
    badge: "Company-Specific",
  },
  {
    icon: Sparkles,
    title: "AI Career Coach",
    description: "Your personal mentor with full context on your profile. Salary negotiation, company prep, upskilling roadmaps — all tailored to your local market.",
    badge: "24/7 Available",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Connect Your Profiles",
    description: "Link GitHub, LeetCode, Codeforces, and other platforms in under 2 minutes. No OAuth required — just your username.",
  },
  {
    step: "02",
    title: "AI Analyses Everything",
    description: "Our AI reads your commit history, contest results, and projects to build a verified developer profile that can't be faked.",
  },
  {
    step: "03",
    title: "Get Noticed & Hired",
    description: "Share your public profile link. Recruiters from top product companies search SkillScope for verified talent every day.",
  },
];



const COMPANIES = ["Google", "Microsoft", "Amazon", "Meta", "Netflix", "Uber", "Stripe", "Airbnb"];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <img src="/logo.svg" alt="SkillScope" className="h-6 w-6" />
            <span className="text-xl">SkillScope</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 lg:py-32 bg-grid-pattern">
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/50 to-background" />
          <div className="container relative z-10 mx-auto px-4 max-w-5xl text-center">
            <motion.div {...fadeUp}>
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
                Built for Software Engineers
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Prove Your Skills.
              <br />
              <span className="text-primary">Land Your Dream Job.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed"
            >
              Connect GitHub, LeetCode, and Codeforces. Get AI-verified skills, an ATS-ready resume, 
              and a public profile that makes top recruiters reach <em>out to you</em>.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/sign-up">
                <Button size="lg" className="h-12 px-8 text-base">
                  Build Your Profile Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">No credit card · No OAuth · 2 min setup</p>
            </motion.div>
          </div>
        </section>



        {/* Companies */}
        <section className="py-10 border-b">
          <div className="container mx-auto px-4 max-w-5xl">
            <p className="text-center text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-6">
              Recruiters from these companies discover talent on SkillScope
            </p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {COMPANIES.map((company) => (
                <span key={company} className="text-base font-bold text-muted-foreground/60 hover:text-foreground transition-colors">
                  {company}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">From zero to offer-ready in days</h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Three steps, no fluff. Your profile is built from code you've already written.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {STEPS.map((step, i) => (
                <div key={step.step} className="relative flex flex-col items-start gap-4 p-6 rounded-2xl border bg-card shadow-sm">
                  <div className="text-5xl font-black text-primary/15 leading-none">{step.step}</div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground/20 z-10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-muted/20 border-y">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Every tool a top engineer needs</h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">One platform that replaces LinkedIn endorsements, resume writing services, and interview prep courses.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="group flex flex-col gap-4 p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-semibold">{feature.badge}</Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1.5">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* Final CTA */}
        <section className="py-24 bg-primary/5 border-t">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <div className="flex justify-center gap-2 mb-6">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">Free to use · No credit card required</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Your next opportunity is waiting
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join 10,000+ engineers who built verified profiles and got discovered by recruiters from top startups and global tech companies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="h-12 px-10 text-base">
                  Start Building Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Setup in 2 minutes</div>
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-blue-500" /> No passwords shared</div>
              <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" /> Real-time updates</div>
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-purple-500" /> 10K+ community</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-10 bg-muted/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <img src="/logo.svg" alt="SkillScope" className="h-5 w-5" />
              SkillScope
            </div>
            <p>© {new Date().getFullYear()} SkillScope. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
