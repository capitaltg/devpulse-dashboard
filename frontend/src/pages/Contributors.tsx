import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { usePaginatedFilter } from '@/hooks/use-paginated-filter';
import { SearchBar, PaginationBar } from '@/components/ListControls';
import axiosInstance from '@/api/axiosInstance';
import { useApp, useWorkspacePath } from '@/contexts/AppContext';

interface ApiContributor {
  author: string;
  total_commits: number;
  total_prs: number;
  repositories_count: number;
  total_additions: number;
  total_deletions: number;
  total_changes: number;
  avg_changes_per_commit: number;
  first_commit_date: string | null;
  last_commit_date: string | null;
  merge_commits: number;
  standard_commits: number;
}

const Contributors = () => {
  const { activeWorkspace, activeOrg } = useApp();
  const workspacePath = useWorkspacePath();
  const [contributors, setContributors] = useState<ApiContributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeWorkspace || !activeOrg) return;
    setLoading(true);
    setError(null);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/stats/stats-by-author`, {
        params: { organization: activeOrg.login ?? activeOrg.id, limit: 100 },
      })
      .then(res => setContributors(res.data.data as ApiContributor[]))
      .catch(err => {
        console.error('Failed to fetch contributors:', err);
        setError('Failed to load contributors');
      })
      .finally(() => setLoading(false));
  }, [activeWorkspace?.id, activeOrg?.id]);

  const filterFn = useCallback((c: ApiContributor, q: string) =>
    c.author.toLowerCase().includes(q), []);

  const { search, setSearch, page, setPage, totalPages, paginated, totalCount } =
    usePaginatedFilter(contributors, filterFn, 10);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contributors</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {totalCount} contributors · last 90 days
            </p>
          </div>
          <SearchBar search={search} onSearchChange={setSearch} placeholder="Search contributors…" />
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading contributors…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <>
            <div className="dashboard-section p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contributor</TableHead>
                    <TableHead className="text-right">Commits</TableHead>
                    <TableHead className="text-right">PRs Opened</TableHead>
                    <TableHead className="text-right">PRs Merged</TableHead>
                    <TableHead className="text-right">Repos</TableHead>
                    <TableHead className="text-right">
                      <span className="text-dashboard-success">+Added</span>{' / '}
                      <span className="text-dashboard-danger">−Removed</span>
                    </TableHead>
                    <TableHead className="text-right">Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((c) => {
                    const initials = c.author.slice(0, 2).toUpperCase();
                    const lastActive = c.last_commit_date
                      ? new Date(c.last_commit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—';
                    return (
                      <TableRow key={c.author} className="group">
                        <TableCell>
                          <Link to={workspacePath(`user/${c.author}`)} className="flex items-center gap-3 hover:text-primary transition-colors">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-accent text-accent-foreground">{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium text-foreground group-hover:text-primary transition-colors">{c.author}</span>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-right font-medium">{c.total_commits.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{c.total_prs.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{c.merge_commits.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{c.repositories_count.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-dashboard-success">+{c.total_additions.toLocaleString()}</span>
                          {' / '}
                          <span className="text-dashboard-danger">−{c.total_deletions.toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">{lastActive}</TableCell>
                      </TableRow>
                    );
                  })}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No contributors found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <PaginationBar page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} label="contributors" />
          </>
        )}
      </main>
    </div>
  );
};

export default Contributors;
