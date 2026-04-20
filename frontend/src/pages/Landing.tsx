import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Github,
  GitPullRequest,
  Users,
  Activity,
  TrendingUp,
  Zap,
  Eye,
  Clock,
  ArrowRight,
  Star,
  Shield,
  BarChart2,
  Bot,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

const previewTabs = [
  { label: 'Dashboard', src: '/screenshots/dashboard.png' },
  { label: 'Repositories', src: '/screenshots/repos.png' },
  { label: 'Pull Requests', src: '/screenshots/pull-requests.png' },
] as const;

function DashboardPreview() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="px-6 pb-24 -mt-4">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-secondary/60 border-b border-border">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-400/60" />
              <div className="w-3 h-3 rounded-full bg-amber-400/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex gap-1 bg-background/60 rounded-md p-0.5">
                {previewTabs.map((tab, i) => (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(i)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      activeTab === i
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Screenshot */}
          <div className="bg-background">
            <img
              src={previewTabs[activeTab].src}
              alt={`DevPulse ${previewTabs[activeTab].label} view`}
              className="w-full h-auto block"
            />
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Real data from a live DevPulse workspace
        </p>
      </div>
    </section>
  );
}

const Landing = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/workspaces', { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-700 dark:text-amber-400" />
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Newsreader', serif" }}>
              DevPulse
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/capitaltg/devpulse-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Features
            </a>
            <a href="#use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Use Cases
            </a>
            <Button
              size="sm"
              onClick={() => auth.signinRedirect()}
              className="gap-1.5"
            >
              Sign In
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-300/50 dark:border-amber-700/50 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30">
            <Star className="w-3 h-3" />
            Open Source &middot; Free to Self-Host
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight"
            style={{ fontFamily: "'Newsreader', serif" }}
          >
            Understand how your engineering team{' '}
            <span className="underline decoration-2 underline-offset-4 decoration-amber-600/40 dark:decoration-amber-400/40">
              actually works
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            DevPulse is an open-source telemetry dashboard that turns your GitHub activity into
            actionable insights about team productivity, PR velocity, and delivery health.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              size="lg"
              onClick={() => auth.signinRedirect()}
              className="gap-2 h-12 px-6 text-sm font-medium"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
            <a
              href="https://github.com/capitaltg/devpulse-dashboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-sm font-medium">
                <Github className="w-4 h-4" />
                View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <DashboardPreview />

      {/* Stats bar */}
      <section className="border-y border-border bg-secondary/30">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Metrics Tracked', value: '30+' },
            { label: 'Real-Time Events', value: 'Webhook' },
            { label: 'AI-Powered', value: 'Insights' },
            { label: 'License', value: 'Open Source' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-amber-800 dark:text-amber-300" style={{ fontFamily: "'Newsreader', serif" }}>{value}</div>
              <div className="text-sm text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "'Newsreader', serif" }}>
              Everything you need to measure what matters
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From commit heatmaps to PR cycle times, DevPulse surfaces the signals that help
              teams ship better software, faster.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <GitPullRequest className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
                title: 'PR Intelligence',
                desc: 'Track PR velocity, review cycles, merge times, and identify stale or blocked pull requests before they become bottlenecks.',
                tint: 'bg-violet-50 dark:bg-violet-950/30',
              },
              {
                icon: <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
                title: 'Real-Time Telemetry',
                desc: 'Live tracking of commits, PRs, issues, and reviews via webhook-based event ingestion with configurable time ranges.',
                tint: 'bg-emerald-50 dark:bg-emerald-950/30',
              },
              {
                icon: <Bot className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
                title: 'AI-Enhanced Analytics',
                desc: 'Automated analysis of PR descriptions, code review quality, and predictive insights about merge likelihood and review delays.',
                tint: 'bg-amber-50 dark:bg-amber-950/30',
              },
              {
                icon: <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
                title: 'Productivity Metrics',
                desc: 'Contribution graphs, PR regularity tracking, commit frequency analysis, and repository health scoring for your whole org.',
                tint: 'bg-blue-50 dark:bg-blue-950/30',
              },
              {
                icon: <Users className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
                title: 'Team Analytics',
                desc: 'Understand work distribution, identify knowledge silos, and surface collaboration gaps across teams and contributors.',
                tint: 'bg-rose-50 dark:bg-rose-950/30',
              },
              {
                icon: <Eye className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
                title: 'Deep Dive Reviews',
                desc: 'Full PR lifecycle analytics from creation to merge, code review participation rates, and response time metrics.',
                tint: 'bg-cyan-50 dark:bg-cyan-950/30',
              },
              {
                icon: <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
                title: 'Cycle Time Tracking',
                desc: 'Measure time-to-merge, review turnaround, and deployment frequency to find where your process slows down.',
                tint: 'bg-orange-50 dark:bg-orange-950/30',
              },
              {
                icon: <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
                title: 'Workflow Monitoring',
                desc: 'CI/CD pipeline visibility with workflow run success rates, duration trends, and failure pattern detection.',
                tint: 'bg-yellow-50 dark:bg-yellow-950/30',
              },
              {
                icon: <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
                title: 'Trend Visualization',
                desc: 'Identify long-term patterns in development activity, code churn, and collaboration effectiveness with rich charts.',
                tint: 'bg-indigo-50 dark:bg-indigo-950/30',
              },
            ].map(({ icon, title, desc, tint }) => (
              <div
                key={title}
                className="border border-border rounded-lg p-6 bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-md ${tint}`}>{icon}</div>
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-secondary/30 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "'Newsreader', serif" }}>
              Up and running in minutes
            </h2>
            <p className="text-muted-foreground">
              Connect your GitHub organizations and start seeing insights immediately.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect GitHub',
                desc: 'Sign in with your GitHub account and select the organizations you want to monitor.',
                color: 'text-emerald-500/40',
              },
              {
                step: '02',
                title: 'Ingest Data',
                desc: 'DevPulse syncs your repository activity and sets up webhooks for real-time event streaming.',
                color: 'text-blue-500/40',
              },
              {
                step: '03',
                title: 'Get Insights',
                desc: 'Explore dashboards for PR velocity, team productivity, workflow health, and AI-powered analysis.',
                color: 'text-amber-500/40',
              },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="text-center sm:text-left">
                <div
                  className={`text-3xl font-bold ${color} mb-2`}
                  style={{ fontFamily: "'Newsreader', serif" }}
                >
                  {step}
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "'Newsreader', serif" }}>
              Built for engineering teams of every shape
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're an IC looking at your own patterns or an engineering director tracking org-wide health,
              DevPulse adapts to your needs.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Engineering Managers',
                desc: 'Monitor team velocity, review bottlenecks, and resource allocation. Spot burnout risk and workload imbalance early.',
                icon: <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
                tint: 'bg-blue-50 dark:bg-blue-950/30',
              },
              {
                title: 'DevOps Teams',
                desc: 'Track CI/CD effectiveness, deployment frequency, and workflow reliability across your entire infrastructure.',
                icon: <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
                tint: 'bg-yellow-50 dark:bg-yellow-950/30',
              },
              {
                title: 'Technical Leaders',
                desc: 'Identify knowledge silos, collaboration gaps, and code ownership patterns to build more resilient teams.',
                icon: <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
                tint: 'bg-violet-50 dark:bg-violet-950/30',
              },
              {
                title: 'Individual Contributors',
                desc: 'Understand personal productivity patterns, review habits, and growth trajectories over time.',
                icon: <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
                tint: 'bg-emerald-50 dark:bg-emerald-950/30',
              },
            ].map(({ title, desc, icon, tint }) => (
              <div
                key={title}
                className="flex gap-4 border border-border rounded-lg p-6 bg-card"
              >
                <div className={`p-2 rounded-md ${tint} h-fit`}>{icon}</div>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open source CTA */}
      <section className="py-24 px-6 bg-secondary/30 border-y border-border">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "'Newsreader', serif" }}>
            Open source. Transparent. Yours to extend.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            DevPulse is fully open source. Self-host it, contribute features, or customize it
            to fit your team's unique workflow. No vendor lock-in, ever.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="https://github.com/capitaltg/devpulse-dashboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="gap-2 h-12 px-6 text-sm font-medium">
                <Github className="w-4 h-4" />
                Star on GitHub
              </Button>
            </a>
            <Button
              variant="outline"
              size="lg"
              onClick={() => auth.signinRedirect()}
              className="gap-2 h-12 px-6 text-sm font-medium"
            >
              Try the Hosted Version
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <span className="text-sm font-semibold" style={{ fontFamily: "'Newsreader', serif" }}>
              DevPulse
            </span>
            <span className="text-xs text-muted-foreground">by <a href="https://www.capitaltg.com/labs" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Capital Technology Group</a></span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href="https://github.com/capitaltg/devpulse-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Github className="w-4 h-4" />
              Source Code
            </a>
            <a
              href="https://github.com/capitaltg/devpulse-dashboard/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Report an Issue
            </a>
            <a
              href="https://github.com/capitaltg/devpulse-dashboard/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              License
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
