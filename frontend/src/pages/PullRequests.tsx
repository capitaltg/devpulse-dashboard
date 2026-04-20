import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { usePaginatedFilter } from '@/hooks/use-paginated-filter';
import { SearchBar, PaginationBar } from '@/components/ListControls';
import { GitPullRequest, GitMerge, XCircle, MessageSquare, FileCode, ChevronsUpDown, Check, Clock, GitCommit, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/api/axiosInstance';
import { useApp, useOrgPath } from '@/contexts/AppContext';
import { useSettings } from '@/contexts/SettingsContext';
import { PeriodSelector } from '@/components/PeriodSelector';

interface RiskFactor {
  factor: string;
  score: number;
  description: string;
}

interface ApiPR {
  id: number;
  number: number;
  title: string;
  status: 'open' | 'merged' | 'closed';
  draft: boolean;
  repo: string;
  author: string;
  created_at: string | null;
  updated_at: string | null;
  labels: string[];
  comments: number;
  review_comments: number;
  additions: number;
  deletions: number;
  changed_files: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: RiskFactor[];
}

interface PROverviewStats {
  total_prs: number;
  open_prs: number;
  merged_prs: number;
  closed_prs: number;
  draft_prs: number;
  merge_rate: number;
  abandon_rate: number;
  avg_time_to_merge_hours: number | null;
  median_time_to_merge_hours: number | null;
  avg_time_to_close_hours: number | null;
  median_time_to_close_hours: number | null;
  avg_files_changed: number;
  avg_commits: number;
  avg_additions: number;
  avg_deletions: number;
  avg_comments: number;
  avg_review_comments: number;
}

function formatHours(hours: number | null): string {
  if (hours === null || hours === undefined) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  if (hours < 168) return `${(hours / 24).toFixed(1)}d`;
  return `${(hours / 168).toFixed(1)}wk`;
}

const statusConfig = {
  open: { label: 'Open', class: 'bg-dashboard-success/15 text-dashboard-success border-dashboard-success/30', icon: GitPullRequest },
  merged: { label: 'Merged', class: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: GitMerge },
  closed: { label: 'Closed', class: 'bg-dashboard-danger/15 text-dashboard-danger border-dashboard-danger/30', icon: XCircle },
};

const riskConfig = {
  low:      { label: 'Low Risk',      class: 'bg-dashboard-success/15 text-dashboard-success border-dashboard-success/30' },
  medium:   { label: 'Medium Risk',   class: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  high:     { label: 'High Risk',     class: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  critical: { label: 'Critical Risk', class: 'bg-dashboard-danger/15 text-dashboard-danger border-dashboard-danger/30' },
};

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function RepoCombobox({ repos, value, onChange }: { repos: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = repos.filter(name => name.toLowerCase().includes(search.toLowerCase()));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[220px] justify-between font-normal">
          {value || 'All repositories'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search repos…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No repository found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__all__" onSelect={() => { onChange('__all__'); setSearch(''); setOpen(false); }}>
                <Check className={cn('mr-2 h-4 w-4', !value ? 'opacity-100' : 'opacity-0')} />
                All repositories
              </CommandItem>
              {filtered.map(name => (
                <CommandItem key={name} value={name} onSelect={() => { onChange(name); setSearch(''); setOpen(false); }}>
                  <Check className={cn('mr-2 h-4 w-4', value === name ? 'opacity-100' : 'opacity-0')} />
                  {name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const PullRequests = () => {
  const { activeWorkspace, activeOrg } = useApp();
  const orgPath = useOrgPath();
  const [searchParams, setSearchParams] = useSearchParams();
  const repoFilter = searchParams.get('repo') || '';

  const [prs, setPrs] = useState<ApiPR[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { days: statsDays } = useSettings();
  const [prStats, setPrStats] = useState<PROverviewStats | null>(null);

  useEffect(() => {
    if (!activeWorkspace || !activeOrg) return;
    setLoading(true);
    setError(null);

    const params: Record<string, string> = { organization: activeOrg.id, limit: '100' };
    if (repoFilter) params.repository = repoFilter;

    axiosInstance
      .get(`/v1/${activeWorkspace.id}/pull-requests`, { params })
      .then(res => setPrs(res.data.data as ApiPR[]))
      .catch(err => {
        console.error('Failed to fetch pull requests:', err);
        setError('Failed to load pull requests');
      })
      .finally(() => setLoading(false));
  }, [activeWorkspace?.id, activeOrg?.id, repoFilter]);

  useEffect(() => {
    if (!activeWorkspace || !activeOrg) return;
    const params: Record<string, string> = {
      organization: activeOrg.login,
      days: String(statsDays),
    };
    if (repoFilter) params.repository = repoFilter;
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/pull-requests/stats`, { params })
      .then(res => setPrStats(res.data.data as PROverviewStats))
      .catch(err => console.error('Failed to fetch PR stats:', err));
  }, [activeWorkspace?.id, activeOrg?.id, repoFilter, statsDays]);

  const repoNames = useMemo(() =>
    [...new Set(prs.map(pr => pr.repo.includes('/') ? pr.repo.split('/')[1] : pr.repo))].sort(),
    [prs]
  );

  const filterFn = useCallback((pr: ApiPR, q: string) =>
    pr.title.toLowerCase().includes(q) ||
    pr.repo.toLowerCase().includes(q) ||
    pr.author.toLowerCase().includes(q) ||
    pr.labels.some(l => l.toLowerCase().includes(q)), []);

  const { search, setSearch, page, setPage, totalPages, paginated, totalCount } =
    usePaginatedFilter(prs, filterFn, 20);

  const setRepoFilter = (value: string) => {
    if (value === '__all__') {
      searchParams.delete('repo');
    } else {
      searchParams.set('repo', value);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pull Requests</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {repoFilter ? `Showing pull requests for ${repoFilter}` : 'Recent pull requests across all repositories'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <PeriodSelector />
            <RepoCombobox repos={repoNames} value={repoFilter} onChange={setRepoFilter} />
            <SearchBar search={search} onSearchChange={setSearch} placeholder="Search PRs…" />
          </div>
        </div>

        {prStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Merge Rate',    value: `${prStats.merge_rate}%`,    sub: 'of closed PRs',    icon: TrendingUp,      color: 'text-dashboard-success' },
              { label: 'Abandon Rate',  value: `${prStats.abandon_rate}%`,   sub: 'of closed PRs',    icon: TrendingDown,    color: 'text-dashboard-danger' },
              { label: 'Avg Close Time',      value: formatHours(prStats.avg_time_to_close_hours),  sub: `median ${formatHours(prStats.median_time_to_close_hours)}`,  icon: Clock,          color: 'text-foreground' },
              { label: 'Avg Merge Time',      value: formatHours(prStats.avg_time_to_merge_hours),  sub: `median ${formatHours(prStats.median_time_to_merge_hours)}`,  icon: GitMerge,       color: 'text-foreground' },
              { label: 'Avg Files Changed',   value: prStats.avg_files_changed.toFixed(1),          sub: 'files per PR',    icon: FileCode,       color: 'text-foreground' },
              { label: 'Avg Commits',         value: prStats.avg_commits.toFixed(1),                sub: 'commits per PR',  icon: GitCommit,      color: 'text-foreground' },
              { label: 'Avg Review Comments', value: prStats.avg_review_comments.toFixed(1),        sub: 'inline comments', icon: MessageSquare,  color: 'text-foreground' },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="dashboard-section p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span className="text-xs">{label}</span>
                </div>
                <span className={`text-xl font-bold ${color}`}>{value}</span>
                <span className="text-xs text-muted-foreground">{sub}</span>
              </div>
            ))}
          </div>
        )}

        {loading && <p className="text-sm text-muted-foreground">Loading pull requests…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <>
            <div className="dashboard-section divide-y divide-border">
              {paginated.map((pr) => {
                const cfg = statusConfig[pr.status] ?? statusConfig.open;
                const StatusIcon = cfg.icon;
                const repoName = pr.repo.includes('/') ? pr.repo.split('/')[1] : pr.repo;
                return (
                  <Link
                    key={pr.id}
                    to={orgPath(`pr/${pr.repo}/${pr.number}`)}
                    className="block py-4 first:pt-0 last:pb-0 hover:bg-accent/30 -mx-6 px-6 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <StatusIcon className={cn('w-5 h-5 mt-0.5 shrink-0',
                        pr.status === 'open' ? 'text-dashboard-success' :
                        pr.status === 'merged' ? 'text-purple-400' : 'text-dashboard-danger'
                      )} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-semibold text-foreground">{pr.title}</h3>
                          {pr.draft && <Badge variant="outline" className="text-xs">Draft</Badge>}
                          <Badge variant="outline" className={cn('text-xs', cfg.class)}>{cfg.label}</Badge>
                          <Badge variant="outline" className={cn('text-xs', riskConfig[pr.risk_level].class)}>
                            <ShieldAlert className="w-3 h-3 mr-1" />
                            {pr.risk_score} · {riskConfig[pr.risk_level].label}
                          </Badge>
                          {pr.labels.map(l => (
                            <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          #{pr.number} · <span className="text-primary">{repoName}</span> · opened by <span className="font-medium">{pr.author}</span> · {formatDate(pr.created_at)}
                        </p>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><FileCode className="w-3.5 h-3.5" /> {pr.changed_files} files</span>
                          <span><span className="text-dashboard-success">+{pr.additions}</span> <span className="text-dashboard-danger">−{pr.deletions}</span></span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {pr.comments + pr.review_comments}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">{formatDate(pr.updated_at)}</span>
                    </div>
                  </Link>
                );
              })}
              {paginated.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">No pull requests found.</p>
              )}
            </div>
            <PaginationBar page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} label="pull requests" />
          </>
        )}
      </main>
    </div>
  );
};

export default PullRequests;
