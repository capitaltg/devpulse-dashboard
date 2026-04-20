import { useCallback, useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { RepoList } from '@/components/RepoList';
import type { Repository } from '@/data/mockData';
import { usePaginatedFilter } from '@/hooks/use-paginated-filter';
import { SearchBar, PaginationBar } from '@/components/ListControls';
import axiosInstance from '@/api/axiosInstance';
import { useApp } from '@/contexts/AppContext';
import { type ApiRepository, mapRepo } from '@/api/repository';

const Repos = () => {
  const { activeWorkspace, activeOrg } = useApp();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeWorkspace || !activeOrg) return;
    setLoading(true);
    setError(null);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/repositories?organization=${activeOrg.id}`)
      .then(res => setRepos((res.data.data as ApiRepository[]).map(mapRepo)))
      .catch(err => {
        console.error('Failed to fetch repositories:', err);
        setError('Failed to load repositories');
      })
      .finally(() => setLoading(false));
  }, [activeWorkspace?.id, activeOrg?.id]);

  const filterFn = useCallback((repo: Repository, q: string) =>
    repo.name.toLowerCase().includes(q) ||
    repo.description.toLowerCase().includes(q) ||
    repo.language.toLowerCase().includes(q), []);

  const { search, setSearch, page, setPage, totalPages, paginated, totalCount } =
    usePaginatedFilter(repos, filterFn, 10);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Repositories</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {activeOrg ? `Repositories in ${activeOrg.name}` : 'All repositories in the organization'}
            </p>
          </div>
          <SearchBar search={search} onSearchChange={setSearch} placeholder="Search repositories…" />
        </div>
        {loading && <p className="text-sm text-muted-foreground">Loading repositories…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && !error && repos.length === 0 && (
          <div className="dashboard-section py-12 text-center">
            <p className="text-muted-foreground">No repositories found for this organization.</p>
          </div>
        )}
        {!loading && !error && repos.length > 0 && totalCount === 0 && (
          <div className="dashboard-section py-12 text-center">
            <p className="text-muted-foreground">No repositories match your search.</p>
          </div>
        )}
        {!loading && !error && totalCount > 0 && (
          <>
            <RepoList repos={paginated} />
            <PaginationBar page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} label="repositories" />
          </>
        )}
      </main>
    </div>
  );
};

export default Repos;
