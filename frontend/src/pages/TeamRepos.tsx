import { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { teams } from '@/data/teamsData';
import { repositories } from '@/data/mockData';
import { RepoList } from '@/components/RepoList';
import { usePaginatedFilter } from '@/hooks/use-paginated-filter';
import { SearchBar, PaginationBar } from '@/components/ListControls';

const TeamRepos = () => {
  const { id } = useParams<{ id: string }>();
  const team = teams.find((t) => t.id === id);

  const teamRepos = team ? repositories.filter((r) => team.repos.includes(r.name)) : [];

  const filterFn = useCallback(
    (repo: typeof repositories[0], q: string) =>
      repo.name.toLowerCase().includes(q) ||
      repo.description.toLowerCase().includes(q) ||
      repo.language.toLowerCase().includes(q),
    [],
  );

  const { search, setSearch, page, setPage, totalPages, paginated, totalCount } =
    usePaginatedFilter(teamRepos, filterFn, 10);

  if (!team) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <TopNav />
        <main className="container mx-auto py-12 text-center">
          <p className="text-muted-foreground text-lg">Team not found</p>
          <Link to="/teams" className="text-primary underline mt-4 inline-block">← Back to teams</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 space-y-6">
        <Link to={`/team/${team.id}`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to {team.name}
        </Link>

        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{team.icon} {team.name} — Repositories</h1>
            <p className="text-muted-foreground text-sm mt-1">{totalCount} repositories owned by this team</p>
          </div>
          <SearchBar search={search} onSearchChange={setSearch} placeholder="Search repositories…" />
        </div>

        <RepoList repos={paginated} />
        <PaginationBar page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} label="repositories" />
      </main>
    </div>
  );
};

export default TeamRepos;
