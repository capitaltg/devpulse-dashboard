import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { WorkflowDonut } from '@/components/WorkflowDonut';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchBar, PaginationBar } from '@/components/ListControls';
import { CheckCircle2, XCircle, Loader2, Ban, Clock, GitBranch, Zap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axiosInstance from '@/api/axiosInstance';
import { useApp } from '@/contexts/AppContext';
import type { ApiWorkflowRun, WorkflowRunStatsData } from '@/api/workflowRun';
import { formatDurationMs, mapWorkflowRun } from '@/api/workflowRun';
import type { WorkflowRun } from '@/data/mockData';

const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<WorkflowRun['status'], { icon: React.ReactNode; className: string; label: string }> = {
  success: { icon: <CheckCircle2 className="w-4 h-4" />, className: 'text-dashboard-success', label: 'Success' },
  failure: { icon: <XCircle className="w-4 h-4" />, className: 'text-dashboard-danger', label: 'Failed' },
  in_progress: { icon: <Loader2 className="w-4 h-4 animate-spin" />, className: 'text-dashboard-warning', label: 'Running' },
  cancelled: { icon: <Ban className="w-4 h-4" />, className: 'text-muted-foreground', label: 'Cancelled' },
};

const WorkflowRunsPage = () => {
  const { activeWorkspace, activeOrg } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<WorkflowRunStatsData | null>(null);

  // Reset to page 1 when filters, search, or context changes
  useEffect(() => { setPage(1); }, [statusFilter, search, activeWorkspace?.id, activeOrg?.id]);

  // Fetch global stats (unaffected by status/search filters)
  useEffect(() => {
    if (!activeWorkspace) return;
    const params = new URLSearchParams();
    if (activeOrg) params.set('organization', activeOrg.login);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/workflow-runs/stats?${params}`)
      .then((res) => setStats(res.data.data as WorkflowRunStatsData))
      .catch((err) => console.error('Failed to fetch workflow stats:', err));
  }, [activeWorkspace?.id, activeOrg?.id]);

  // Fetch paginated, filtered runs
  useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (activeOrg) params.set('organization', activeOrg.login);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search.trim()) params.set('search', search.trim());
    params.set('page', String(page));
    params.set('limit', String(PAGE_SIZE));
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/workflow-runs?${params}`)
      .then((res) => {
        setRuns((res.data.data as ApiWorkflowRun[]).map(mapWorkflowRun));
        setTotal(res.data.total as number);
      })
      .catch((err) => {
        console.error('Failed to fetch workflow runs:', err);
        setError('Failed to load workflow runs.');
      })
      .finally(() => setLoading(false));
  }, [activeWorkspace?.id, activeOrg?.id, statusFilter, search, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const donutData = stats
    ? [
        { name: 'Success',     value: stats.success,     color: 'hsl(142, 71%, 45%)' },
        { name: 'Failed',      value: stats.failure,     color: 'hsl(0, 84%, 60%)' },
        { name: 'Cancelled',   value: stats.cancelled,   color: 'hsl(215, 16%, 47%)' },
        { name: 'In Progress', value: stats.in_progress, color: 'hsl(38, 92%, 50%)' },
      ].filter((d) => d.value > 0)
    : [];

  const summaryStats = stats
    ? [
        { label: 'Total Runs',   value: stats.total.toLocaleString(),            valueClass: 'text-foreground' },
        { label: 'Success Rate', value: `${stats.success_rate}%`,                valueClass: 'text-dashboard-success' },
        { label: 'Avg Duration', value: formatDurationMs(stats.avg_duration_ms), valueClass: 'text-foreground' },
        { label: 'Failed',       value: stats.failure.toLocaleString(),          valueClass: stats.failure > 0 ? 'text-dashboard-danger' : 'text-foreground' },
        { label: 'Running',      value: stats.in_progress.toLocaleString(),      valueClass: stats.in_progress > 0 ? 'text-dashboard-warning' : 'text-foreground' },
        { label: 'Cancelled',    value: stats.cancelled.toLocaleString(),        valueClass: 'text-muted-foreground' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Workflow Runs</h1>
            <p className="text-muted-foreground text-sm mt-1">All CI/CD workflow runs across the organization</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failed</SelectItem>
                <SelectItem value="in_progress">Running</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <SearchBar search={search} onSearchChange={setSearch} placeholder="Search workflows…" />
          </div>
        </div>

        {stats && (
          <div className="grid lg:grid-cols-2 gap-6">
            <WorkflowDonut data={donutData} title="Workflow Results" />
            <div className="grid grid-cols-3 gap-4 content-start">
              {summaryStats.map((stat) => (
                <div key={stat.label} className="dashboard-section py-4 px-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.valueClass}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="dashboard-section">
          {loading && (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading workflow runs…</p>
          )}
          {error && (
            <p className="text-sm text-destructive py-6 text-center">{error}</p>
          )}
          {!loading && !error && runs.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No workflow runs found.</p>
          )}
          {!loading && !error && runs.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Repository</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => {
                  const status = STATUS_CONFIG[run.status];
                  return (
                    <TableRow key={run.id}>
                      <TableCell>
                        <span className={`flex items-center gap-1.5 ${status.className}`}>
                          {status.icon}
                          <span className="text-sm font-medium">{status.label}</span>
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{run.name}</TableCell>
                      <TableCell>
                        <Link to={`/repo/${run.repo}`} className="text-sm text-primary hover:underline">
                          {run.repo}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <GitBranch className="w-3.5 h-3.5" /> {run.branch}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <Zap className="w-3.5 h-3.5" /> {run.trigger}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" /> {run.duration}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{run.timestamp}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <PaginationBar page={page} totalPages={totalPages} totalCount={total} onPageChange={setPage} label="runs" />
      </main>
    </div>
  );
};

export default WorkflowRunsPage;
