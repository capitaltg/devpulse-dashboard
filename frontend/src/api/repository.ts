import type { Repository } from '@/data/mockData';

export interface ApiRepository {
  id: number;
  name: string;
  private: boolean;
  description: string | null;
  language: string | null;
  pushed_at: string | null;
  recent_pr_count: number | null;
  recent_commit_count: number | null;
}

export function mapRepo(r: ApiRepository): Repository {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    language: r.language ?? '',
    stars: 0,
    forks: 0,
    openIssues: 0,
    openPRs: r.recent_pr_count ?? 0,
    lastUpdated: r.pushed_at
      ? new Date(r.pushed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—',
    private: r.private ?? false,
    topics: [],
    commits30d: r.recent_commit_count ?? 0,
    contributors: 0,
    linesAdded: 0,
    linesRemoved: 0,
    workflowStats: { totalRuns30d: 0, successRate: 0, avgDurationMs: 0, failedRuns30d: 0 },
  };
}
