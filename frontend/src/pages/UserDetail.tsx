import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp, useOrgPath } from '@/contexts/AppContext';
import { ArrowLeft, GitCommit, GitPullRequest, GitMerge, Plus, Minus, Star, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Mail, Building2, MapPin } from 'lucide-react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { CommitHeatmap } from '@/components/CommitHeatmap';
import { type ActivityEvent } from '@/components/ActivityFeed';
import axiosInstance from '@/api/axiosInstance';
import { useSettings } from '@/contexts/SettingsContext';
import { PeriodSelector } from '@/components/PeriodSelector';

const FEED_TYPE_FILTERS = [
  { label: 'All',       value: null },
  { label: 'Pushes',    value: 'push' },
  { label: 'PR Opened', value: 'pr_opened' },
  { label: 'PR Merged', value: 'pr_merged' },
  { label: 'Issues',    value: 'issue_opened' },
  { label: 'Closed',    value: 'issue_closed' },
  { label: 'Releases',  value: 'release' },
];

const FEED_PAGE_SIZE = 15;

interface ApiMember {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  blog: string | null;
  avatar_url: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

interface UserActivityStats {
  login: string;
  days: number;
  commits: number;
  prs_opened: number;
  prs_merged: number;
  total_additions: number;
  total_deletions: number;
  repos_contributed: number;
  avg_hours_to_merge: number | null;
}

interface LinesByRepoPoint {
  repo_full_name: string;
  additions: number;
  deletions: number;
  commits: number;
}

interface ContributionsByDatePoint {
  date: string;
  commits: number;
  prs_merged: number;
  issues_opened: number;
  pr_reviews: number;
  issue_comments: number;
}

type ContribType = 'commits' | 'prs_merged' | 'issues_opened' | 'pr_reviews' | 'issue_comments';

const CONTRIB_TYPES: { key: ContribType; label: string }[] = [
  { key: 'commits',        label: 'Commits' },
  { key: 'prs_merged',     label: 'PRs Merged' },
  { key: 'issues_opened',  label: 'Issues Opened' },
  { key: 'pr_reviews',     label: 'PR Reviews' },
  { key: 'issue_comments', label: 'Issue Comments' },
];

const HEATMAP_DAYS = 52 * 7;

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildContributionsHeatmap(points: ContributionsByDatePoint[], types: Set<ContribType>): number[] {
  const countByDate = new Map<string, number>();
  for (const pt of points) {
    const total =
      (types.has('commits')        ? pt.commits        : 0) +
      (types.has('prs_merged')     ? pt.prs_merged     : 0) +
      (types.has('issues_opened')  ? pt.issues_opened  : 0) +
      (types.has('pr_reviews')     ? pt.pr_reviews     : 0) +
      (types.has('issue_comments') ? pt.issue_comments : 0);
    if (total > 0) countByDate.set(pt.date.slice(0, 10), total);
  }
  const result: number[] = [];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (HEATMAP_DAYS - 1));
  for (let i = 0; i < HEATMAP_DAYS; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    result.push(countByDate.get(toDateKey(d)) ?? 0);
  }
  return result;
}

function fmtHours(h: number): string {
  if (h < 24) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

const UserDetail = () => {
  const { workspace, username } = useParams<{ workspace: string; username: string }>();
  const { activeWorkspace, activeOrg, setActiveWorkspace } = useApp();
  const orgPath = useOrgPath();

  useEffect(() => {
    if (!workspace) return;
    if (activeWorkspace?.id !== workspace) {
      setActiveWorkspace({ id: workspace, name: workspace, relationship: '' });
    }
  }, [workspace]);

  const [member, setMember] = useState<ApiMember | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [stats, setStats] = useState<UserActivityStats | null>(null);
  const [linesByRepo, setLinesByRepo] = useState<LinesByRepoPoint[]>([]);
  const [contributions, setContributions] = useState<ContributionsByDatePoint[]>([]);
  const [activeContribTypes, setActiveContribTypes] = useState<Set<ContribType>>(
    new Set(['commits', 'prs_merged', 'issues_opened', 'pr_reviews', 'issue_comments'])
  );
  const { days } = useSettings();

  // Fetch member profile (once)
  useEffect(() => {
    if (!activeWorkspace || !username) return;
    setMemberLoading(true);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/members/${username}`)
      .then((res) => setMember(res.data.data as ApiMember))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
        else console.error('Failed to fetch member:', err);
      })
      .finally(() => setMemberLoading(false));
  }, [activeWorkspace?.id, username]);

  // Fetch activity stats (re-runs when period or org changes)
  useEffect(() => {
    if (!activeWorkspace || !username) return;
    const params = new URLSearchParams({ days: String(days) });
    if (activeOrg) params.set('organization', activeOrg.login);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/members/${username}/stats?${params}`)
      .then((res) => setStats(res.data.data as UserActivityStats))
      .catch((err) => console.error('Failed to fetch member stats:', err));
  }, [activeWorkspace?.id, activeOrg?.id, username, days]);

  // Fetch lines-by-repo breakdown (re-runs when period or org changes)
  useEffect(() => {
    if (!activeWorkspace || !username) return;
    const params = new URLSearchParams({ days: String(days) });
    if (activeOrg) params.set('organization', activeOrg.login);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/members/${username}/lines-by-repo?${params}`)
      .then((res) => setLinesByRepo(res.data.data as LinesByRepoPoint[]))
      .catch(() => setLinesByRepo([]));
  }, [activeWorkspace?.id, activeOrg?.id, username, days]);

  // Fetch contributions heatmap by author
  useEffect(() => {
    if (!activeWorkspace || !username) return;
    const params: Record<string, string> = { author: username, days: '365' };
    if (activeOrg) params.organization = activeOrg.login;
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/contributions-by-date`, { params })
      .then((res) => setContributions((res.data.data ?? []) as ContributionsByDatePoint[]))
      .catch(() => setContributions([]));
  }, [activeWorkspace?.id, activeOrg?.id, username]);

  // Event feed state
  const [allEvents, setAllEvents] = useState<ActivityEvent[]>([]);
  const [feedSearch, setFeedSearch] = useState('');
  const [feedTypeFilter, setFeedTypeFilter] = useState<string | null>(null);
  const [feedPage, setFeedPage] = useState(1);

  useEffect(() => {
    if (!activeWorkspace || !username) return;
    const params = new URLSearchParams({ user: username, days: '90', limit: '100' });
    if (activeOrg) params.set('organization', activeOrg.login);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/recent-activity?${params}`)
      .then((res) => {
        setAllEvents(res.data.data as ActivityEvent[]);
        setFeedPage(1);
      })
      .catch((err) => console.error('Failed to fetch user activity feed:', err));
  }, [activeWorkspace?.id, activeOrg?.id, username]);

  useEffect(() => { setFeedPage(1); }, [feedSearch, feedTypeFilter]);

  const heatmapData = useMemo(
    () => buildContributionsHeatmap(contributions, activeContribTypes),
    [contributions, activeContribTypes],
  );

  const contribTotals = useMemo(() => {
    const t = { commits: 0, prs_merged: 0, issues_opened: 0, pr_reviews: 0, issue_comments: 0 } as Record<ContribType, number>;
    for (const pt of contributions) {
      t.commits += pt.commits;
      t.prs_merged += pt.prs_merged;
      t.issues_opened += pt.issues_opened;
      t.pr_reviews += pt.pr_reviews;
      t.issue_comments += pt.issue_comments;
    }
    return t;
  }, [contributions]);

  const heatmapControls = (
    <div className="flex flex-col gap-y-2">
      {CONTRIB_TYPES.map(({ key, label }) => (
        <label key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={activeContribTypes.has(key)}
            onChange={(e) => {
              setActiveContribTypes((prev) => {
                const next = new Set(prev);
                if (e.target.checked) next.add(key); else next.delete(key);
                return next;
              });
            }}
            className="w-3.5 h-3.5 accent-primary"
          />
          {label} <span className="tabular-nums">({contribTotals[key].toLocaleString()})</span>
        </label>
      ))}
    </div>
  );

  const filteredEvents = useMemo(() => {
    const q = feedSearch.trim().toLowerCase();
    return allEvents.filter((e) => {
      if (feedTypeFilter && e.type !== feedTypeFilter) return false;
      if (q && !e.repo.toLowerCase().includes(q) && !e.message.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allEvents, feedSearch, feedTypeFilter]);

  const feedTotalPages = Math.max(1, Math.ceil(filteredEvents.length / FEED_PAGE_SIZE));
  const pagedEvents = filteredEvents.slice((feedPage - 1) * FEED_PAGE_SIZE, feedPage * FEED_PAGE_SIZE);

  if (memberLoading) {
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

  if (notFound || !member) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <TopNav />
        <main className="container mx-auto py-12 text-center">
          <p className="text-muted-foreground text-lg">User not found</p>
          <Link to={orgPath('contributors')} className="text-primary underline mt-4 inline-block">← Back to contributors</Link>
        </main>
      </div>
    );
  }

  const displayName = member.name ?? member.login;
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link to={orgPath('contributors')} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to contributors
          </Link>
          <PeriodSelector />
        </div>

        {/* User header */}
        <div className="dashboard-section">
          <div className="flex items-center gap-5">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={displayName} className="w-16 h-16 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-xl font-bold text-accent-foreground shrink-0">
                  {initials}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                <p className="text-muted-foreground">@{member.login}</p>
                {member.bio && <p className="text-sm text-muted-foreground mt-1">{member.bio}</p>}
                <div className="flex flex-wrap gap-4 mt-1 text-xs text-muted-foreground">
                  {member.company  && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {member.company}</span>}
                  {member.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {member.location}</span>}
                  {member.email    && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {member.email}</span>}
                </div>
              </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <GitCommit className="w-4 h-4 text-muted-foreground" />
              <span className="stat-label">Commits</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats ? stats.commits.toLocaleString() : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">last {days}d</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <GitPullRequest className="w-4 h-4 text-muted-foreground" />
              <span className="stat-label">PRs Opened</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats ? stats.prs_opened.toLocaleString() : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">last {days}d</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <GitMerge className="w-4 h-4 text-muted-foreground" />
              <span className="stat-label">PRs Merged</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats ? stats.prs_merged.toLocaleString() : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">last {days}d</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="w-4 h-4 text-muted-foreground" />
              <span className="stat-label">Repos</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats ? stats.repos_contributed.toLocaleString() : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">contributed to</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <Plus className="w-4 h-4 text-dashboard-success" />
              <span className="stat-label">Lines Added</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats ? stats.total_additions.toLocaleString() : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">last {days}d</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <Minus className="w-4 h-4 text-dashboard-danger" />
              <span className="stat-label">Lines Removed</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats ? stats.total_deletions.toLocaleString() : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">last {days}d</p>
          </div>
        </div>

        {/* Commit heatmap */}
        <CommitHeatmap data={heatmapData} title="Contribution Activity (last year)" controls={heatmapControls} />

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Code impact */}
          <div className="dashboard-section">
            <h2 className="text-lg font-semibold text-foreground mb-4">Code Impact by Repository</h2>
            {linesByRepo.length > 0 ? (
              <div className="space-y-2">
                {(() => {
                  const maxAdd = Math.max(...linesByRepo.map((r) => r.additions), 1);
                  return linesByRepo.map((row) => (
                    <div key={row.repo_full_name}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-foreground truncate max-w-[55%]" title={row.repo_full_name}>
                          {row.repo_full_name.includes('/') ? row.repo_full_name.split('/')[1] : row.repo_full_name}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          <span className="text-dashboard-success">+{row.additions.toLocaleString()}</span>
                          {' / '}
                          <span className="text-dashboard-danger">−{row.deletions.toLocaleString()}</span>
                          <span className="ml-1.5 text-muted-foreground">{row.commits} commit{row.commits !== 1 ? 's' : ''}</span>
                        </span>
                      </div>
                      <div className="metric-bar">
                        <div
                          className="h-full rounded-full bg-dashboard-success/60 transition-all duration-500"
                          style={{ width: `${Math.round((row.additions / maxAdd) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No repository breakdown available.</p>
            )}
          </div>

          {/* Merge velocity */}
          <div className="dashboard-section">
            <h2 className="text-lg font-semibold text-foreground mb-4">PR Velocity</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-1">PRs Opened</p>
                <p className="text-xl font-bold text-foreground">{stats?.prs_opened ?? '—'}</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-1">PRs / week</p>
                {(() => {
                  if (!stats) return <p className="text-xl font-bold text-foreground">—</p>;
                  const perWeek = (stats.prs_opened / stats.days) * 7;
                  const display = perWeek % 1 === 0 ? perWeek.toFixed(0) : perWeek.toFixed(1);
                  if (perWeek >= 5) {
                    return (
                      <p className="flex items-center gap-1 text-xl font-bold text-dashboard-success">
                        {display}<Star className="w-4 h-4 fill-current" />
                      </p>
                    );
                  }
                  if (perWeek >= 2) {
                    return <p className="text-xl font-bold text-foreground">{display}</p>;
                  }
                  return <p className="text-xl font-bold text-dashboard-warning">{display}</p>;
                })()}
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-1">PRs Merged</p>
                <p className="text-xl font-bold text-foreground">{stats?.prs_merged ?? '—'}</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-1">Merge Rate</p>
                <p className="text-xl font-bold text-foreground">
                  {stats && stats.prs_opened > 0
                    ? `${Math.round((stats.prs_merged / stats.prs_opened) * 100)}%`
                    : '—'}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-1">Avg. to Merge</p>
                <p className="text-xl font-bold text-foreground">
                  {stats?.avg_hours_to_merge != null ? fmtHours(stats.avg_hours_to_merge) : '—'}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-1">Commits / PR</p>
                <p className="text-xl font-bold text-foreground">
                  {stats && stats.prs_opened > 0
                    ? (stats.commits / stats.prs_opened).toFixed(1)
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Event Feed */}
        <div className="dashboard-section space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-foreground">Event Feed</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search repo or message…"
                value={feedSearch}
                onChange={(e) => setFeedSearch(e.target.value)}
                className="pl-8 pr-8 py-1.5 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-56"
              />
              {feedSearch && (
                <button
                  onClick={() => setFeedSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {FEED_TYPE_FILTERS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setFeedTypeFilter(value)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  feedTypeFilter === value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {pagedEvents.length} of {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            {(feedSearch || feedTypeFilter) ? ' (filtered)' : ''} · last 90 days
          </p>

          {pagedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No events found.</p>
          ) : (
            <div className="space-y-1">
              {pagedEvents.map((event) => (
                <div key={event.id} className="activity-item">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    event.type === 'pr_merged' || event.type === 'issue_closed' ? 'bg-dashboard-success' :
                    event.type === 'pr_opened' ? 'bg-dashboard-warning' :
                    event.type === 'issue_opened' ? 'bg-dashboard-danger' :
                    event.type === 'release' ? 'bg-purple-500' : 'bg-primary'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="text-muted-foreground">{event.message}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.repo} · {new Date(event.timestamp.endsWith('Z') || event.timestamp.includes('+') ? event.timestamp : event.timestamp + 'Z').toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {feedTotalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                onClick={() => setFeedPage((p) => Math.max(1, p - 1))}
                disabled={feedPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="text-xs text-muted-foreground">Page {feedPage} of {feedTotalPages}</span>
              <button
                onClick={() => setFeedPage((p) => Math.min(feedTotalPages, p + 1))}
                disabled={feedPage === feedTotalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserDetail;
