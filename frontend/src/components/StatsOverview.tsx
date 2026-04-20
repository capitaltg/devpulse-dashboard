import type { OrgOverviewStats } from '@/api/orgStats';
import { GitBranch, Users, GitCommit, GitPullRequest, AlertCircle, GitMerge, PlayCircle, CheckCircle2 } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
}

function StatCard({ label, value, icon, sub }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="stat-label">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export function StatsOverview({ stats }: { stats: OrgOverviewStats | null }) {
  const d = stats?.days ?? 90;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
      <StatCard label="Active Repos"    value={stats?.active_repos ?? '—'}     icon={<GitBranch className="w-5 h-5" />}      sub={`repos w/ commits (${d}d)`} />
      <StatCard label="Contributors"    value={stats?.contributors ?? '—'}      icon={<Users className="w-5 h-5" />}          sub={`unique authors (${d}d)`} />
      <StatCard label="Commits"         value={stats?.commits ?? '—'}           icon={<GitCommit className="w-5 h-5" />}       sub={`last ${d} days`} />
      <StatCard label="PRs Opened"      value={stats?.prs_opened ?? '—'}        icon={<GitPullRequest className="w-5 h-5" />}  sub={`last ${d} days`} />
      <StatCard label="Issues Opened"   value={stats?.issues_opened ?? '—'}     icon={<AlertCircle className="w-5 h-5" />}    sub={`last ${d} days`} />
      <StatCard label="PRs Merged"      value={stats?.prs_merged ?? '—'}        icon={<GitMerge className="w-5 h-5" />}       sub={`last ${d} days`} />
      <StatCard label="Workflow Runs"   value={stats?.workflow_runs ?? '—'}     icon={<PlayCircle className="w-5 h-5" />}     sub={`last ${d} days`} />
      <StatCard label="Success Rate"    value={stats ? `${stats.workflow_success_rate}%` : '—'} icon={<CheckCircle2 className="w-5 h-5" />} sub="workflow runs" />
    </div>
  );
}
