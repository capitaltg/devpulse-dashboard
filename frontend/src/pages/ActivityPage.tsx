import { useEffect, useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { ActivityFeed, type ActivityEvent } from '@/components/ActivityFeed';
import { ActivityBarChart } from '@/components/ActivityBarChart';
import { GitCommit, GitPullRequest, GitMerge, AlertCircle, Play, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { useApp } from '@/contexts/AppContext';
import type { OrgOverviewStats } from '@/api/orgStats';
import { useSettings } from '@/contexts/SettingsContext';
import { PeriodSelector } from '@/components/PeriodSelector';

const TYPE_FILTERS = [
  { label: 'All',       value: null },
  { label: 'Pushes',    value: 'push' },
  { label: 'PR Opened', value: 'pr_opened' },
  { label: 'PR Merged', value: 'pr_merged' },
  { label: 'Issues',    value: 'issue_opened' },
  { label: 'Closed',    value: 'issue_closed' },
  { label: 'Releases',  value: 'release' },
];

const PAGE_SIZE = 20;

const ActivityPage = () => {
  const { activeWorkspace, activeOrg } = useApp();
  const { days } = useSettings();

  const [overviewStats, setOverviewStats] = useState<OrgOverviewStats | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<{ week: string; commits: number; prsOpened: number; prsMerged: number; workflowRuns: number }[]>([]);
  const [allEvents, setAllEvents] = useState<ActivityEvent[]>([]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!activeWorkspace) return;
    const params = new URLSearchParams({ days: String(days) });
    if (activeOrg) params.set('organization', activeOrg.login);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/overview?${params}`)
      .then((res) => setOverviewStats(res.data.data as OrgOverviewStats))
      .catch((err) => console.error('Failed to fetch overview stats:', err));
  }, [activeWorkspace?.id, activeOrg?.id, days]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const weeks = days <= 30 ? 4 : days <= 60 ? 8 : days <= 90 ? 12 : 52;
    const params = new URLSearchParams({ weeks: String(weeks) });
    if (activeOrg) params.set('organization', activeOrg.login);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/weekly-activity?${params}`)
      .then((res) => {
        const raw = res.data.data as { week: string; commits: number; prs_opened: number; prs_merged: number; workflow_runs: number }[];
        setWeeklyActivity(raw.map((p) => ({
          week: new Date(p.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          commits: p.commits,
          prsOpened: p.prs_opened,
          prsMerged: p.prs_merged,
          workflowRuns: p.workflow_runs,
        })));
      })
      .catch((err) => console.error('Failed to fetch weekly activity:', err));
  }, [activeWorkspace?.id, activeOrg?.id, days]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const params = new URLSearchParams({ days: String(days), limit: '100' });
    if (activeOrg) params.set('organization', activeOrg.login);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/recent-activity?${params}`)
      .then((res) => {
        setAllEvents(res.data.data as ActivityEvent[]);
        setPage(1);
      })
      .catch((err) => console.error('Failed to fetch recent activity:', err));
  }, [activeWorkspace?.id, activeOrg?.id, days]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, typeFilter]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allEvents.filter((e) => {
      if (typeFilter && e.type !== typeFilter) return false;
      if (q && !e.actor.toLowerCase().includes(q) && !e.repo.toLowerCase().includes(q) && !e.message.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allEvents, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const pagedEvents = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const s = overviewStats;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 space-y-6">

        {/* Header + period selector */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activity</h1>
            <p className="text-muted-foreground text-sm mt-1">Organization-wide activity and trends</p>
          </div>
          <PeriodSelector />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <GitCommit className="w-4 h-4 text-muted-foreground" />
              <span className="stat-label">Commits</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{s ? s.commits.toLocaleString() : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">last {days}d</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <GitPullRequest className="w-4 h-4 text-muted-foreground" />
              <span className="stat-label">PRs Opened</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{s ? s.prs_opened.toLocaleString() : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">last {days}d</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <GitMerge className="w-4 h-4 text-muted-foreground" />
              <span className="stat-label">PRs Merged</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{s ? s.prs_merged.toLocaleString() : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">last {days}d</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="stat-label">Issues Opened</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{s ? s.issues_opened.toLocaleString() : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">last {days}d</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <Play className="w-4 h-4 text-muted-foreground" />
              <span className="stat-label">Workflow Runs</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{s ? s.workflow_runs.toLocaleString() : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {s ? `${s.workflow_success_rate}% success` : `last ${days}d`}
            </p>
          </div>
        </div>

        {/* Weekly Activity chart */}
        <ActivityBarChart data={weeklyActivity} />

        {/* Event Feed */}
        <div className="dashboard-section space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-foreground">Event Feed</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search actor, repo, message…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-8 py-1.5 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-64"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Type filter pills */}
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setTypeFilter(value)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  typeFilter === value
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
            {(search || typeFilter) ? ' (filtered)' : ''}
          </p>

          {/* Feed list (no card wrapper — already inside dashboard-section) */}
          {pagedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No events match your filters.</p>
          ) : (
            <div className="space-y-1">
              {pagedEvents.map((event) => {
                // Render inline so we stay inside the parent card
                const iconMap = {
                  push: 'text-navy-500',
                  pr_opened: 'text-dashboard-warning',
                  pr_merged: 'text-dashboard-success',
                  issue_opened: 'text-dashboard-danger',
                  issue_closed: 'text-dashboard-success',
                  release: 'text-navy-700',
                } as Record<string, string>;
                return (
                  <div key={event.id} className="activity-item">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      event.type === 'pr_merged' || event.type === 'issue_closed' ? 'bg-dashboard-success' :
                      event.type === 'pr_opened' ? 'bg-dashboard-warning' :
                      event.type === 'issue_opened' ? 'bg-dashboard-danger' :
                      event.type === 'release' ? 'bg-purple-500' : 'bg-primary'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium text-primary">{event.actor}</span>{' '}
                        <span className="text-muted-foreground">{event.message}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {event.repo} · {new Date(event.timestamp.endsWith('Z') || event.timestamp.includes('+') ? event.timestamp : event.timestamp + 'Z').toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
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

export default ActivityPage;
