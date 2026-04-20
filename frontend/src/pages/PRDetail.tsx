import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, GitPullRequest, GitMerge, XCircle, GitCommit, MessageSquare, FileCode, ExternalLink, ShieldAlert } from 'lucide-react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useApp, useOrgPath } from '@/contexts/AppContext';
import axiosInstance from '@/api/axiosInstance';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface RiskFactor {
  factor: string;
  score: number;
  description: string;
}

interface ApiPR {
  id: number;
  number: number;
  title: string;
  body: string | null;
  status: 'open' | 'merged' | 'closed';
  repo: string;
  author: string;
  created_at: string | null;
  updated_at: string | null;
  closed_at: string | null;
  merged_at: string | null;
  merged_by: string | null;
  labels: string[];
  assignees: string[];
  requested_reviewers: string[];
  comments: number;
  review_comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
  head_ref: string | null;
  base_ref: string | null;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: RiskFactor[];
}

const statusConfig = {
  open: { label: 'Open', class: 'bg-dashboard-success/15 text-dashboard-success border-dashboard-success/30', icon: GitPullRequest },
  merged: { label: 'Merged', class: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: GitMerge },
  closed: { label: 'Closed', class: 'bg-dashboard-danger/15 text-dashboard-danger border-dashboard-danger/30', icon: XCircle },
};

const riskConfig = {
  low:      { label: 'Low Risk',      class: 'bg-dashboard-success/15 text-dashboard-success border-dashboard-success/30', barColor: 'bg-dashboard-success' },
  medium:   { label: 'Medium Risk',   class: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', barColor: 'bg-yellow-400' },
  high:     { label: 'High Risk',     class: 'bg-orange-500/15 text-orange-400 border-orange-500/30', barColor: 'bg-orange-400' },
  critical: { label: 'Critical Risk', class: 'bg-dashboard-danger/15 text-dashboard-danger border-dashboard-danger/30', barColor: 'bg-dashboard-danger' },
};


const PRDetail = () => {
  const { org, repo, number } = useParams<{ org: string; repo: string; number: string }>();
  const { activeWorkspace } = useApp();
  const orgPath = useOrgPath();
  const [pr, setPr] = useState<ApiPR | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!activeWorkspace || !org || !repo || !number) return;
    setLoading(true);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/pull-requests/${org}/${repo}/${number}`)
      .then(res => setPr(res.data.data as ApiPR))
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
        else console.error('Failed to fetch PR:', err);
      })
      .finally(() => setLoading(false));
  }, [activeWorkspace?.id, org, repo, number]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <TopNav />
        <main className="container mx-auto py-12 text-center">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  if (notFound || !pr) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <TopNav />
        <main className="container mx-auto py-12 text-center">
          <p className="text-muted-foreground text-lg">Pull request not found</p>
          <Link to={orgPath('pull-requests')} className="text-primary underline mt-4 inline-block">← Back to pull requests</Link>
        </main>
      </div>
    );
  }

  const cfg = statusConfig[pr.status];
  const StatusIcon = cfg.icon;
  const repoFullName = pr.repo.includes('/') ? pr.repo : `${org}/${pr.repo}`;
  const repoName = repoFullName.split('/')[1] ?? repoFullName;
  const repoUrl = `https://github.com/${repoFullName}`;
  const prUrl = `${repoUrl}/pull/${pr.number}`;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 space-y-6">
        <Link to={orgPath('pull-requests')} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to pull requests
        </Link>

        {/* Header */}
        <div className="dashboard-section">
          <div className="flex items-start gap-3">
            <StatusIcon className={cn('w-6 h-6 mt-1 shrink-0', pr.status === 'open' ? 'text-dashboard-success' : pr.status === 'merged' ? 'text-purple-400' : 'text-dashboard-danger')} />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{pr.title} <span className="text-muted-foreground font-normal">#{pr.number}</span></h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className={cn('text-xs', cfg.class)}>{cfg.label}</Badge>
                <a
                  href={prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  Open PR
                  <ExternalLink className="w-4 h-4" />
                </a>
                <span className="text-sm text-muted-foreground">
                  <span className="text-primary font-medium">{pr.author}</span>
                  {pr.head_ref && pr.base_ref && (
                    <>{' '}wants to merge <span className="font-mono text-xs bg-accent px-1.5 py-0.5 rounded">{pr.head_ref}</span> into <span className="font-mono text-xs bg-accent px-1.5 py-0.5 rounded">{pr.base_ref}</span></>
                  )}
                </span>
              </div>
              {pr.labels.length > 0 && (
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {pr.labels.map(l => (
                    <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="stat-card">
            <span className="stat-label">Changed Files</span>
            <div className="text-xl font-bold text-foreground flex items-center gap-1.5"><FileCode className="w-4 h-4 text-muted-foreground" />{pr.changed_files}</div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Additions</span>
            <div className="text-xl font-bold text-dashboard-success">+{pr.additions.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Deletions</span>
            <div className="text-xl font-bold text-dashboard-danger">−{pr.deletions.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Comments</span>
            <div className="text-xl font-bold text-foreground flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-muted-foreground" />{pr.comments + pr.review_comments}</div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Commits</span>
            <div className="text-xl font-bold text-foreground flex items-center gap-1.5"><GitCommit className="w-4 h-4 text-muted-foreground" />{pr.commits}</div>
          </div>
        </div>

        {/* Risk Score */}
        <div className="dashboard-section">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className={cn('w-5 h-5', pr.risk_level === 'low' ? 'text-dashboard-success' : pr.risk_level === 'medium' ? 'text-yellow-400' : pr.risk_level === 'high' ? 'text-orange-400' : 'text-dashboard-danger')} />
            <h2 className="text-lg font-semibold text-foreground">Risk Assessment</h2>
            <Badge variant="outline" className={cn('text-xs', riskConfig[pr.risk_level].class)}>
              {pr.risk_score}/100 · {riskConfig[pr.risk_level].label}
            </Badge>
          </div>
          <div className="w-full h-2 bg-accent rounded-full mb-4">
            <div
              className={cn('h-2 rounded-full transition-all', riskConfig[pr.risk_level].barColor)}
              style={{ width: `${pr.risk_score}%` }}
            />
          </div>
          <div className="space-y-2">
            {pr.risk_factors.map((f) => (
              <div key={f.factor} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">{f.factor}</span>
                  <span className="text-muted-foreground">— {f.description}</span>
                </div>
                <span className={cn('font-mono text-xs px-2 py-0.5 rounded',
                  f.score === 0 ? 'bg-dashboard-success/15 text-dashboard-success' :
                  f.score <= 10 ? 'bg-yellow-500/15 text-yellow-400' :
                  'bg-dashboard-danger/15 text-dashboard-danger'
                )}>+{f.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        {pr.body && (
          <div className="dashboard-section">
            <h2 className="text-lg font-semibold text-foreground mb-3">Description</h2>
            <div className="prose prose-sm prose-invert max-w-none text-muted-foreground [&_a]:text-primary [&_a]:underline [&_code]:bg-accent [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-accent [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_img]:rounded-md [&_table]:w-full [&_th]:text-left [&_th]:p-2 [&_td]:p-2 [&_tr]:border-b [&_tr]:border-border [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:my-2 [&_hr]:border-border [&_hr]:my-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{ img: () => null }}>{pr.body}</ReactMarkdown>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Reviewers */}
          <div className="dashboard-section">
            <h2 className="text-lg font-semibold text-foreground mb-4">Requested Reviewers</h2>
            {pr.requested_reviewers.length > 0 ? (
              <div className="space-y-3">
                {pr.requested_reviewers.map((r) => (
                  <div key={r} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
                      {r.split('-').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <span className="text-sm text-foreground">{r}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reviewers assigned.</p>
            )}
          </div>

          {/* Repository & metadata */}
          <div className="dashboard-section">
            <h2 className="text-lg font-semibold text-foreground mb-4">Repository</h2>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {pr.created_at && <p>Opened: {new Date(pr.created_at).toLocaleDateString()}</p>}
              {pr.merged_at && <p>Merged: {new Date(pr.merged_at).toLocaleDateString()}{pr.merged_by ? ` by ${pr.merged_by}` : ''}</p>}
              {pr.closed_at && !pr.merged_at && <p>Closed: {new Date(pr.closed_at).toLocaleDateString()}</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PRDetail;
