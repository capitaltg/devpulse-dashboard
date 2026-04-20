import { useEffect, useMemo, useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { StatsOverview } from '@/components/StatsOverview';
import { RepoList } from '@/components/RepoList';
import { ActivityFeed, type ActivityEvent } from '@/components/ActivityFeed';
import { LanguageBreakdown } from '@/components/Charts';
import { CommitHeatmap } from '@/components/CommitHeatmap';
import { ActivityBarChart } from '@/components/ActivityBarChart';
import { WorkflowDonut } from '@/components/WorkflowDonut';
import { PRCycleTimeChart } from '@/components/PRCycleTimeChart';
import type { Repository } from '@/data/mockData';
import axiosInstance from '@/api/axiosInstance';
import { useApp } from '@/contexts/AppContext';
import { type ApiRepository, mapRepo } from '@/api/repository';
import { type WorkflowRunStatsData } from '@/api/workflowRun';
import type { OrgOverviewStats } from '@/api/orgStats';
import { useSettings } from '@/contexts/SettingsContext';
import { PeriodSelector } from '@/components/PeriodSelector';

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
  { key: 'commits',       label: 'Commits' },
  { key: 'prs_merged',    label: 'PRs Merged' },
  { key: 'issues_opened', label: 'Issues Opened' },
  { key: 'pr_reviews',    label: 'PR Reviews' },
  { key: 'issue_comments',label: 'Issue Comments' },
];

const HEATMAP_DAYS = 52 * 7;

function toDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildContributionsHeatmap(
  points: ContributionsByDatePoint[],
  types: Set<ContribType>,
): number[] {
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

  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + (HEATMAP_DAYS - 1 - i));
    result.push(countByDate.get(toDateKey(d)) ?? 0);
  }
  return result;
}

const Index = () => {
  const { activeWorkspace, activeOrg } = useApp();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [contributions, setContributions] = useState<ContributionsByDatePoint[]>([]);
  const [activeContribTypes, setActiveContribTypes] = useState<Set<ContribType>>(
    new Set(['commits', 'prs_merged', 'issues_opened', 'pr_reviews', 'issue_comments'])
  );
  const [workflowStats, setWorkflowStats] = useState<WorkflowRunStatsData | null>(null);
  const [orgOverviewStats, setOrgOverviewStats] = useState<OrgOverviewStats | null>(null);
  const { days: overviewDays } = useSettings();
  const [weeklyActivity, setWeeklyActivity] = useState<{ week: string; commits: number; prsOpened: number; prsMerged: number; workflowRuns: number }[]>([]);
  const [languageData, setLanguageData] = useState<{ language: string; percentage: number; color: string }[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [prCycleTime, setPrCycleTime] = useState<{ week: string; avgHours: number; medianHours: number }[]>([]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const params = new URLSearchParams({ days: String(overviewDays) });
    if (activeOrg) params.set('organization', activeOrg.login);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/overview?${params}`)
      .then((res) => setOrgOverviewStats(res.data.data as OrgOverviewStats))
      .catch((err) => console.error('Failed to fetch org overview stats:', err));
  }, [activeWorkspace?.id, activeOrg?.id, overviewDays]);

  useEffect(() => {
    if (!activeWorkspace || !activeOrg) return;
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/repositories?organization=${activeOrg.id}&limit=5`)
      .then(res => setRepos((res.data.data as ApiRepository[]).map(mapRepo)))
      .catch(err => console.error('Failed to fetch repositories:', err));
  }, [activeWorkspace?.id, activeOrg?.id]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const params = new URLSearchParams();
    if (activeOrg) params.set('organization', activeOrg.login);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/workflow-runs/stats?${params}`)
      .then((res) => setWorkflowStats(res.data.data as WorkflowRunStatsData))
      .catch((err) => console.error('Failed to fetch workflow stats:', err));
  }, [activeWorkspace?.id, activeOrg?.id]);

  useEffect(() => {
    if (!activeWorkspace || !activeOrg) return;
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/contributions-by-date`, {
        params: { organization: activeOrg.login ?? activeOrg.id },
      })
      .then((res) => setContributions(res.data.data as ContributionsByDatePoint[]))
      .catch((err) => {
        console.error('Failed to fetch contributions by date:', err);
        setContributions([]);
      });
  }, [activeWorkspace?.id, activeOrg?.id, activeOrg?.login]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const params = new URLSearchParams({ weeks: '12' });
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
  }, [activeWorkspace?.id, activeOrg?.id]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const params = new URLSearchParams();
    if (activeOrg) params.set('organization', activeOrg.login);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/language-distribution?${params}`)
      .then((res) => {
        const raw = res.data.data as { language: string; percentage: number; color: string }[];
        setLanguageData(raw);
      })
      .catch((err) => console.error('Failed to fetch language distribution:', err));
  }, [activeWorkspace?.id, activeOrg?.id]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const params = new URLSearchParams({ limit: '20' });
    if (activeOrg) params.set('organization', activeOrg.login);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/recent-activity?${params}`)
      .then((res) => setActivityEvents(res.data.data as ActivityEvent[]))
      .catch((err) => console.error('Failed to fetch recent activity:', err));
  }, [activeWorkspace?.id, activeOrg?.id]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const params = new URLSearchParams({ weeks: '12' });
    if (activeOrg) params.set('organization', activeOrg.login);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/pr-cycle-time?${params}`)
      .then((res) => {
        const raw = res.data.data as { week: string; avg_hours: number; median_hours: number }[];
        setPrCycleTime(raw.map((p) => ({
          week: new Date(p.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          avgHours: p.avg_hours,
          medianHours: p.median_hours,
        })));
      })
      .catch((err) => console.error('Failed to fetch PR cycle time:', err));
  }, [activeWorkspace?.id, activeOrg?.id]);

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 space-y-6 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activity Overview</h1>
            <p className="text-muted-foreground text-sm mt-1">Showing data for the selected period</p>
          </div>
          <PeriodSelector />
        </div>
        <StatsOverview stats={orgOverviewStats} />

        <CommitHeatmap
          data={heatmapData}
          title="Organization Activity"
          controls={heatmapControls}
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <ActivityBarChart data={weeklyActivity} />
          <div className="grid gap-6">
            <WorkflowDonut
              data={workflowStats ? [
                { name: 'Success',     value: workflowStats.success,     color: 'hsl(142, 71%, 45%)' },
                { name: 'Failed',      value: workflowStats.failure,     color: 'hsl(0, 84%, 60%)' },
                { name: 'Cancelled',   value: workflowStats.cancelled,   color: 'hsl(215, 16%, 47%)' },
                { name: 'In Progress', value: workflowStats.in_progress, color: 'hsl(38, 92%, 50%)' },
              ].filter((d) => d.value > 0) : []}
              showViewAll
            />
            <PRCycleTimeChart data={prCycleTime} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LanguageBreakdown data={languageData} />
            <RepoList repos={repos} showViewAll />
          </div>
          <div className="space-y-6">
            <ActivityFeed events={activityEvents} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
