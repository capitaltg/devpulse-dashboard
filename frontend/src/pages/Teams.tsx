import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { Users, GitCommit, GitPullRequest, GitMerge } from 'lucide-react';
import { usePaginatedFilter } from '@/hooks/use-paginated-filter';
import { SearchBar, PaginationBar } from '@/components/ListControls';
import axiosInstance from '@/api/axiosInstance';
import { useApp, useOrgPath } from '@/contexts/AppContext';

interface ApiTeam {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

const Teams = () => {
  const { activeWorkspace, activeOrg } = useApp();
  const orgPath = useOrgPath();
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeWorkspace || !activeOrg) return;
    setLoading(true);
    setError(null);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/organizations/${activeOrg.id}/teams`)
      .then(res => setTeams(res.data.data as ApiTeam[]))
      .catch(err => {
        console.error('Failed to fetch teams:', err);
        setError('Failed to load teams');
      })
      .finally(() => setLoading(false));
  }, [activeWorkspace?.id, activeOrg?.id]);

  const filterFn = useCallback((team: ApiTeam, q: string) =>
    team.name.toLowerCase().includes(q) ||
    (team.description ?? '').toLowerCase().includes(q) ||
    team.slug.toLowerCase().includes(q), []);

  const { search, setSearch, page, setPage, totalPages, paginated, totalCount } =
    usePaginatedFilter(teams, filterFn, 9);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Teams</h1>
            <p className="text-muted-foreground text-sm mt-1">Browse teams and drill down into team-level metrics</p>
          </div>
          <SearchBar search={search} onSearchChange={setSearch} placeholder="Search teams…" />
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading teams…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.map((team) => (
                <Link
                  key={team.id}
                  to={orgPath(`team/${team.slug}`)}
                  className="dashboard-section hover:ring-2 hover:ring-primary/20 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{team.name}</h2>
                      <p className="text-xs text-muted-foreground">{team.description ?? team.slug}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>members</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <GitCommit className="w-3.5 h-3.5" />
                      <span>commits</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <GitPullRequest className="w-3.5 h-3.5" />
                      <span>PRs opened</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>merged</span>
                    </div>
                  </div>
                </Link>
              ))}
              {paginated.length === 0 && (
                <p className="col-span-3 text-center text-muted-foreground py-8">No teams found.</p>
              )}
            </div>
            <PaginationBar page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} label="teams" />
          </>
        )}
      </main>
    </div>
  );
};

export default Teams;
