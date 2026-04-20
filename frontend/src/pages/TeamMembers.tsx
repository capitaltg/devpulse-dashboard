import { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { teams, getTeamMembers } from '@/data/teamsData';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePaginatedFilter } from '@/hooks/use-paginated-filter';
import { SearchBar, PaginationBar } from '@/components/ListControls';
import type { Contributor } from '@/data/mockData';

const TeamMembers = () => {
  const { id, workspace } = useParams<{ id: string; workspace: string }>();
  const team = teams.find((t) => t.id === id);

  const members = team ? getTeamMembers(team) : [];

  const filterFn = useCallback(
    (m: Contributor, q: string) =>
      m.name.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q),
    [],
  );

  const { search, setSearch, page, setPage, totalPages, paginated, totalCount } =
    usePaginatedFilter(members, filterFn, 10);

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
            <h1 className="text-2xl font-bold text-foreground">{team.icon} {team.name} — Members</h1>
            <p className="text-muted-foreground text-sm mt-1">{totalCount} members in this team</p>
          </div>
          <SearchBar search={search} onSearchChange={setSearch} placeholder="Search members…" />
        </div>

        <div className="dashboard-section">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Commits (30d)</TableHead>
                <TableHead className="text-right">PRs Opened</TableHead>
                <TableHead className="text-right">PRs Merged</TableHead>
                <TableHead className="text-right">Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((m) => (
                <TableRow key={m.username}>
                  <TableCell>
                    <Link to={`/${workspace}/user/${m.username}`} className="flex items-center gap-2 hover:underline">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] font-medium bg-primary/10 text-primary">
                          {m.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{m.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{m.role}</TableCell>
                  <TableCell className="text-right font-medium">{m.commits30d}</TableCell>
                  <TableCell className="text-right font-medium">{m.prsOpened}</TableCell>
                  <TableCell className="text-right font-medium">{m.prsMerged}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">{m.lastActive}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <PaginationBar page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} label="members" />
      </main>
    </div>
  );
};

export default TeamMembers;
