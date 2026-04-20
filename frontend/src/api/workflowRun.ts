import type { WorkflowRun } from '@/data/mockData';

export interface ApiWorkflowRun {
  id: number;
  name: string;
  workflow_id: number;
  repository_full_name: string;
  /** DB status: queued | in_progress | completed */
  status: string;
  /** DB conclusion: success | failure | cancelled | timed_out | skipped | neutral | null */
  conclusion: string | null;
  event: string;
  head_branch: string | null;
  head_sha: string;
  run_number: number;
  triggering_actor_login: string | null;
  html_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  run_started_at: string | null;
}

export interface WorkflowRunStatsData {
  total: number;
  success: number;
  failure: number;
  in_progress: number;
  cancelled: number;
  success_rate: number;
  avg_duration_ms: number;
}

function deriveFrontendStatus(
  status: string,
  conclusion: string | null,
): WorkflowRun['status'] {
  if (status === 'in_progress' || status === 'queued') return 'in_progress';
  if (conclusion === 'success') return 'success';
  if (conclusion === 'failure' || conclusion === 'timed_out' || conclusion === 'startup_failure')
    return 'failure';
  return 'cancelled';
}

/** Parse an ISO timestamp as UTC even when the timezone suffix is absent. */
function parseUtc(s: string): number {
  return new Date(s.endsWith('Z') || s.includes('+') ? s : s + 'Z').getTime();
}

function formatDuration(
  startedAt: string | null,
  updatedAt: string | null,
): { duration: string; durationMs: number } {
  if (!startedAt) return { duration: '—', durationMs: 0 };
  const start = parseUtc(startedAt);
  const end = updatedAt ? parseUtc(updatedAt) : Date.now();
  const ms = Math.max(0, end - start);
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  const duration = mins > 0 ? `${mins}m ${remSecs}s` : `${remSecs}s`;
  return { duration, durationMs: ms };
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diffMs = Date.now() - parseUtc(dateStr);
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function formatDurationMs(ms: number): string {
  if (!ms) return '—';
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  return mins > 0 ? `${mins}m ${remSecs}s` : `${remSecs}s`;
}

export function mapWorkflowRun(r: ApiWorkflowRun): WorkflowRun {
  const { duration, durationMs } = formatDuration(r.run_started_at, r.updated_at);
  return {
    id: r.id,
    name: r.name,
    repo: r.repository_full_name.split('/')[1] ?? r.repository_full_name,
    status: deriveFrontendStatus(r.status, r.conclusion),
    duration,
    durationMs,
    trigger: r.event,
    branch: r.head_branch ?? '—',
    timestamp: formatRelativeTime(r.created_at),
  };
}
