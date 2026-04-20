import { Link, useParams } from 'react-router-dom';
import { GitBranch, GitPullRequest, GitMerge, AlertCircle, CheckCircle, Tag } from 'lucide-react';

export interface ActivityEvent {
  id: string;
  type: 'push' | 'pr_opened' | 'pr_merged' | 'issue_opened' | 'issue_closed' | 'release';
  actor: string;
  repo: string;
  repo_full_name: string;
  message: string;
  title?: string | null;
  timestamp: string; // ISO datetime
}

const iconMap = {
  push: GitBranch,
  pr_opened: GitPullRequest,
  pr_merged: GitMerge,
  issue_opened: AlertCircle,
  issue_closed: CheckCircle,
  release: Tag,
};

const colorMap: Record<string, string> = {
  push: 'text-navy-500',
  pr_opened: 'text-dashboard-warning',
  pr_merged: 'text-dashboard-success',
  issue_opened: 'text-dashboard-danger',
  issue_closed: 'text-dashboard-success',
  release: 'text-navy-700',
};

function parseUtc(iso: string): number {
  return new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').getTime();
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - parseUtc(iso);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const { workspace } = useParams<{ workspace: string }>();
  return (
    <div className="dashboard-section">
      <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        <div className="space-y-1">
          {events.map((event) => {
            const Icon = iconMap[event.type];
            return (
              <div key={event.id} className="activity-item">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${colorMap[event.type]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    <Link to={`/${workspace}/user/${event.actor}`} className="font-medium text-primary hover:underline">{event.actor}</Link>{' '}
                    <span className="text-muted-foreground">{event.message}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {event.repo} · {timeAgo(event.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
