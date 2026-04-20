import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, GitPullRequest, Users, GitCommit, Lock, Globe, Plus, Minus, PlayCircle, CheckCircle2, XCircle, Clock, GitMerge, FileCode, MessageSquare, ExternalLink } from 'lucide-react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CommitHeatmap } from '@/components/CommitHeatmap';
import { WorkflowDonut } from '@/components/WorkflowDonut';
import { PRCycleTimeChart } from '@/components/PRCycleTimeChart';
import { CodeChangesChart } from '@/components/CodeChangesChart';
import axiosInstance from '@/api/axiosInstance';
import { useApp, useOrgPath, useWorkspacePath } from '@/contexts/AppContext';
import type { WorkflowRunStatsData } from '@/api/workflowRun';
import { mapWorkflowRun } from '@/api/workflowRun';
import type { WorkflowRun } from '@/data/mockData';

interface ApiRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string | null;
  language: string | null;
  default_branch: string | null;
  pushed_at: string | null;
  updated_at: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  recent_commit_count: number;
  recent_pr_count: number;
}

interface MemberActivity {
  author: string;
  author_id: number | null;
  organization: string;
  total_prs: number;
  open_prs: number;
  closed_unmerged_prs: number;
  merged_prs: number;
  draft_prs: number;
  repositories_contributed_to: number;
  total_additions: number;
  total_deletions: number;
  total_files_changed: number;
  avg_lines_changed: number;
  avg_comments_per_pr: number;
  first_pr_date: string | null;
  latest_pr_date: string | null;
  avg_hours_to_merge: number | null;
  avg_hours_to_close: number | null;
}

interface ActivityEvent {
  id: string;
  type: string;
  actor: string;
  repo: string;
  repo_full_name: string;
  message: string;
  title: string | null;
  timestamp: string;
}

interface CommitByDate {
  date: string;
  day_of_week_number: number;
  commit_count: number;
}

interface PRCycleTime {
  week: string;
  avg_hours: number;
  median_hours: number;
}

interface CodeChangePoint {
  date: string;
  commit_count: number;
  total_additions: number;
  total_deletions: number;
  total_changes: number;
  unique_authors: number;
}

interface ApiPullRequest {
  id: number;
  number: number;
  title: string;
  status: 'open' | 'merged' | 'closed';
  repo: string;
  author: string;
  created_at: string | null;
  updated_at: string | null;
  closed_at: string | null;
  merged_at: string | null;
  comments: number;
  review_comments: number;
  additions: number;
  deletions: number;
  changed_files: number;
  head_ref: string | null;
  base_ref: string | null;
  labels: string[];
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const RepoDetail = () => {
  const { name } = useParams<{ name: string }>();
  const { activeWorkspace, activeOrg } = useApp();
  const orgPath = useOrgPath();
  const workspacePath = useWorkspacePath();
  const [repo, setRepo] = useState<ApiRepo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [workflowStats, setWorkflowStats] = useState<WorkflowRunStatsData | null>(null);
  const [repoContributors, setRepoContributors] = useState<MemberActivity[]>([]);
  const [repoWorkflows, setRepoWorkflows] = useState<WorkflowRun[]>([]);
  const [repoEvents, setRepoEvents] = useState<ActivityEvent[]>([]);
  const [heatmapData, setHeatmapData] = useState<number[]>([]);
  const [cycleTimeData, setCycleTimeData] = useState<{ week: string; avgHours: number; medianHours: number }[] | null>(null);
  const [codeChangePoints, setCodeChangePoints] = useState<CodeChangePoint[]>([]);
  const [repoPRs, setRepoPRs] = useState<ApiPullRequest[]>([]);
  const [totalPRs, setTotalPRs] = useState(0);

  useEffect(() => {
    if (!activeWorkspace || !activeOrg || !name) return;
    setLoading(true);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/repositories/${activeOrg.id}/${name}`)
      .then(res => setRepo(res.data.data as ApiRepo))
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
        else console.error('Failed to fetch repository:', err);
      })
      .finally(() => setLoading(false));
  }, [activeWorkspace?.id, activeOrg?.id, name]);

  useEffect(() => {
    if (!activeWorkspace || !activeOrg || !name) return;
    const params = new URLSearchParams({ organization: activeOrg.login, repository: name });
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/workflow-runs/stats?${params}`)
      .then(res => setWorkflowStats(res.data.data as WorkflowRunStatsData))
      .catch(err => console.error('Failed to fetch workflow stats:', err));
  }, [activeWorkspace?.id, activeOrg?.id, name]);

  // Fetch contributors (member activity)
  useEffect(() => {
    if (!activeWorkspace || !activeOrg || !name) return;
    const params = new URLSearchParams({ organization: activeOrg.login, repository: name, limit: '20', days: '90' });
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/member-activity?${params}`)
      .then(res => setRepoContributors(res.data.data as MemberActivity[]))
      .catch(err => console.error('Failed to fetch contributors:', err));
  }, [activeWorkspace?.id, activeOrg?.id, name]);

  // Fetch recent workflow runs
  useEffect(() => {
    if (!activeWorkspace || !activeOrg || !name) return;
    const params = new URLSearchParams({ organization: activeOrg.login, repository: name, limit: '10' });
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/workflow-runs?${params}`)
      .then(res => setRepoWorkflows((res.data.data as any[]).map(mapWorkflowRun)))
      .catch(err => console.error('Failed to fetch workflow runs:', err));
  }, [activeWorkspace?.id, activeOrg?.id, name]);

  // Fetch recent activity
  useEffect(() => {
    if (!activeWorkspace || !activeOrg || !name) return;
    const params = new URLSearchParams({ organization: activeOrg.login, repository: name, days: '30', limit: '20' });
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/recent-activity?${params}`)
      .then(res => setRepoEvents(res.data.data as ActivityEvent[]))
      .catch(err => console.error('Failed to fetch recent activity:', err));
  }, [activeWorkspace?.id, activeOrg?.id, name]);

  // Fetch commit heatmap data
  useEffect(() => {
    if (!activeWorkspace || !activeOrg || !name) return;
    const params = new URLSearchParams({ organization: activeOrg.login, repository: name, days: '365' });
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/commits-by-date?${params}`)
      .then(res => {
        const points = res.data.data as CommitByDate[];
        // Convert to 364-entry array (52 weeks * 7 days) indexed oldest-first
        const map = new Map<string, number>();
        for (const p of points) map.set(p.date, p.commit_count);
        const arr: number[] = [];
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // anchor to Saturday
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 363);
        for (let i = 0; i < 364; i++) {
          const d = new Date(startDate);
          d.setDate(startDate.getDate() + i);
          const key = d.toISOString().slice(0, 10);
          arr.push(map.get(key) ?? 0);
        }
        setHeatmapData(arr);
      })
      .catch(err => console.error('Failed to fetch commit heatmap:', err));
  }, [activeWorkspace?.id, activeOrg?.id, name]);

  // Fetch PR cycle time
  useEffect(() => {
    if (!activeWorkspace || !activeOrg || !name) return;
    const params = new URLSearchParams({ organization: activeOrg.login, repository: name, weeks: '12' });
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/pr-cycle-time?${params}`)
      .then(res => {
        const points = res.data.data as PRCycleTime[];
        if (points.length > 0) {
          setCycleTimeData(points.map(p => ({ week: p.week, avgHours: p.avg_hours, medianHours: p.median_hours })));
        }
      })
      .catch(err => console.error('Failed to fetch PR cycle time:', err));
  }, [activeWorkspace?.id, activeOrg?.id, name]);

  // Fetch code changes (30d)
  useEffect(() => {
    if (!activeWorkspace || !activeOrg || !name) return;
    const params = new URLSearchParams({ organization: activeOrg.login, repository: name });
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/commit-additions-deletions?${params}`)
      .then(res => {
        const points = res.data.data as CodeChangePoint[];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        setCodeChangePoints(points.filter(p => p.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date)));
      })
      .catch(err => console.error('Failed to fetch code changes:', err));
  }, [activeWorkspace?.id, activeOrg?.id, name]);

  // Fetch pull requests
  useEffect(() => {
    if (!activeWorkspace || !activeOrg || !name) return;
    const params = new URLSearchParams({ organization: activeOrg.login, repository: name, limit: '5' });
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/pull-requests?${params}`)
      .then(res => {
        setRepoPRs(res.data.data as ApiPullRequest[]);
        setTotalPRs(res.data.total as number);
      })
      .catch(err => console.error('Failed to fetch pull requests:', err));
  }, [activeWorkspace?.id, activeOrg?.id, name]);

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

  if (notFound || !repo) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <TopNav />
        <main className="container mx-auto py-12 text-center">
          <p className="text-muted-foreground text-lg">Repository not found</p>
          <Link to={orgPath('repos')} className="text-primary underline mt-4 inline-block">← Back to repositories</Link>
        </main>
      </div>
    );
  }

  const workflowBreakdown = workflowStats
    ? [
        { name: 'Success',     value: workflowStats.success,     color: 'hsl(142, 71%, 45%)' },
        { name: 'Failed',      value: workflowStats.failure,     color: 'hsl(0, 84%, 60%)' },
        { name: 'Cancelled',   value: workflowStats.cancelled,   color: 'hsl(215, 16%, 47%)' },
        { name: 'In Progress', value: workflowStats.in_progress, color: 'hsl(38, 92%, 50%)' },
      ].filter((d) => d.value > 0)
    : [];

  const stats = [
    { label: 'Open Issues', value: repo.open_issues_count, icon: <AlertCircle className="w-4 h-4" /> },
    { label: 'Open PRs (30d)', value: repo.recent_pr_count, icon: <GitPullRequest className="w-4 h-4" /> },
    { label: 'Contributors', value: repoContributors.length || '—', icon: <Users className="w-4 h-4" /> },
    { label: 'Commits (30d)', value: repo.recent_commit_count, icon: <GitCommit className="w-4 h-4" /> },
    { label: 'Workflow Runs', value: workflowStats?.total ?? '—', icon: <PlayCircle className="w-4 h-4" /> },
    { label: 'Success Rate', value: workflowStats ? `${workflowStats.success_rate}%` : '—', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const repoUrl = repo.html_url ?? (repo.full_name ? `https://github.com/${repo.full_name}` : null);
  const statusIcon = { open: GitPullRequest, merged: GitMerge, closed: XCircle };
  const statusColor = { open: 'text-dashboard-success', merged: 'text-purple-400', closed: 'text-dashboard-danger' };
  const statusBadge = {
    open: 'bg-dashboard-success/15 text-dashboard-success border-dashboard-success/30',
    merged: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    closed: 'bg-dashboard-danger/15 text-dashboard-danger border-dashboard-danger/30',
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 space-y-6">
        <Link to={orgPath('repos')} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to repositories
        </Link>

        {/* Repo header */}
        <div className="dashboard-section">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{repo.name}</h1>
                {repo.private ? (
                  <span className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                    <Globe className="w-3 h-3" /> Public
                  </span>
                )}
                {repoUrl && (
                  <a href={repoUrl} target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors" title="Open on GitHub">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-muted-foreground">{repo.description ?? ''}</p>
              {repo.language && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-md font-medium">{repo.language}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Updated {formatDate(repo.pushed_at ?? repo.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-muted-foreground">{stat.icon}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Commit Activity + Code Changes row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {heatmapData.length > 0 && (
            <CommitHeatmap data={heatmapData} title="Commit Activity" />
          )}
          <CodeChangesChart data={codeChangePoints} title="Code Changes (30d)" />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-6">
          <WorkflowDonut data={workflowBreakdown} title="Workflow Results (30d)" />
          {cycleTimeData && <PRCycleTimeChart data={cycleTimeData} title="PR Cycle Time" />}
        </div>

        {/* Contributors */}
        <div className="dashboard-section">
          <h2 className="text-lg font-semibold text-foreground mb-4">Contributors</h2>
          {repoContributors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contributor</TableHead>
                  <TableHead className="text-right">PRs Opened</TableHead>
                  <TableHead className="text-right">PRs Merged</TableHead>
                  <TableHead className="text-right">Lines Added</TableHead>
                  <TableHead className="text-right">Lines Removed</TableHead>
                  <TableHead className="text-right">Avg Hrs to Merge</TableHead>
                  <TableHead className="text-right">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repoContributors.map((c) => {
                  const initials = c.author
                    .split(/[-_ ]/)
                    .map((n) => n[0]?.toUpperCase() ?? '')
                    .join('')
                    .slice(0, 2);
                  return (
                    <TableRow key={c.author}>
                      <TableCell>
                        <Link to={workspacePath(`user/${c.author}`)} className="flex items-center gap-2 hover:underline">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] font-medium bg-primary/10 text-primary">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground truncate">{c.author}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-medium">{c.total_prs}</TableCell>
                      <TableCell className="text-right font-medium">{c.merged_prs}</TableCell>
                      <TableCell className="text-right font-medium text-dashboard-success">+{c.total_additions.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium text-dashboard-danger">−{c.total_deletions.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{c.avg_hours_to_merge != null ? `${Math.round(c.avg_hours_to_merge)}h` : '—'}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">{c.latest_pr_date ? formatDate(c.latest_pr_date) : '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">No contributors found.</p>
          )}
        </div>

        {/* Workflow Runs */}
        <div className="dashboard-section">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Workflow Runs</h2>
          {repoWorkflows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repoWorkflows.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        w.status === 'success' ? 'text-dashboard-success' :
                        w.status === 'failure' ? 'text-dashboard-danger' :
                        w.status === 'in_progress' ? 'text-dashboard-warning' :
                        'text-muted-foreground'
                      }`}>
                        {w.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {w.status === 'failure' && <XCircle className="w-3.5 h-3.5" />}
                        {w.status === 'in_progress' && <Clock className="w-3.5 h-3.5" />}
                        {w.status === 'cancelled' && <XCircle className="w-3.5 h-3.5" />}
                        {w.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">{w.branch}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{w.trigger}</TableCell>
                    <TableCell className="text-right text-sm">{w.duration}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">{w.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">No workflow runs found.</p>
          )}
        </div>

        {/* Recent Pull Requests */}
        <div className="dashboard-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Pull Requests</h2>
            {totalPRs > 0 && (
              <Link to={orgPath(`pull-requests?repo=${encodeURIComponent(repo.name)}`)} className="text-sm text-primary hover:underline">
                View all {totalPRs} PRs →
              </Link>
            )}
          </div>
          {repoPRs.length > 0 ? (
            <div className="divide-y divide-border">
              {repoPRs.map((pr) => {
                const Icon = statusIcon[pr.status];
                return (
                  <div key={pr.id} className="block py-3 first:pt-0 last:pb-0 -mx-6 px-6">
                    <div className="flex items-start gap-3">
                      <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', statusColor[pr.status])} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-semibold text-foreground">{pr.title}</span>
                          <Badge variant="outline" className={cn('text-xs', statusBadge[pr.status])}>{pr.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          #{pr.number} · by <span className="font-medium">{pr.author}</span> · {formatDate(pr.created_at)}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><FileCode className="w-3 h-3" /> {pr.changed_files} files</span>
                          <span><span className="text-dashboard-success">+{pr.additions}</span> <span className="text-dashboard-danger">−{pr.deletions}</span></span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {pr.comments + pr.review_comments}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(pr.updated_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No pull requests found.</p>
          )}
        </div>

        {/* Recent activity */}
        <div className="dashboard-section">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
          {repoEvents.length > 0 ? (
            <div className="space-y-3">
              {repoEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="text-foreground">
                      <span className="font-medium">{event.actor}</span>{' '}
                      <span className="text-muted-foreground">{event.message}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(event.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No recent activity for this repository.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default RepoDetail;
