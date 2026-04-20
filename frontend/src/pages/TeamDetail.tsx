import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, GitCommit, GitPullRequest, GitMerge, CheckCircle, Plus, Minus } from 'lucide-react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { CommitHeatmap } from '@/components/CommitHeatmap';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp, useOrgPath } from '@/contexts/AppContext';
import axiosInstance from '@/api/axiosInstance';

interface ApiTeam {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  privacy: string | null;
  html_url: string | null;
}

const TeamDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { activeWorkspace, activeOrg } = useApp();
  const orgPath = useOrgPath();
  const [team, setTeam] = useState<ApiTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!activeWorkspace || !activeOrg || !slug) return;
    setLoading(true);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/organizations/${activeOrg.login}/teams/${slug}`)
      .then(res => {
        if (res.data.data) setTeam(res.data.data as ApiTeam);
        else setNotFound(true);
      })
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
        else console.error('Failed to fetch team:', err);
      })
      .finally(() => setLoading(false));
  }, [activeWorkspace?.id, activeOrg?.login, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <TopNav />
        <main className="container mx-auto py-12 text-center">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  if (notFound || !team) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <TopNav />
        <main className="container mx-auto py-12 text-center">
          <p className="text-muted-foreground text-lg">Team not found</p>
          <Link to={orgPath('teams')} className="text-primary underline mt-4 inline-block">← Back to teams</Link>
        </main>
      </div>
    );
  }

  const statCards = [
    { label: 'Members', value: '—', icon: <Users className="w-4 h-4" /> },
    { label: 'Commits (30d)', value: '—', icon: <GitCommit className="w-4 h-4" /> },
    { label: 'PRs Opened', value: '—', icon: <GitPullRequest className="w-4 h-4" /> },
    { label: 'PRs Merged', value: '—', icon: <GitMerge className="w-4 h-4" /> },
    { label: 'Issues Closed', value: '—', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 space-y-6">
        <Link to={orgPath('teams')} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to teams
        </Link>

        {/* Team header */}
        <div className="dashboard-section">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
              {team.description && <p className="text-muted-foreground">{team.description}</p>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-muted-foreground">{s.icon}</span>
                <span className="stat-label">{s.label}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <CommitHeatmap data={[]} title="Team Commit Activity" />

        {/* Code impact */}
        <div className="dashboard-section">
          <h2 className="text-lg font-semibold text-foreground mb-4">Code Impact (30d)</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-dashboard-success" />
              <span className="text-sm text-muted-foreground">Added</span>
              <span className="font-bold text-foreground ml-auto">—</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="w-4 h-4 text-dashboard-danger" />
              <span className="text-sm text-muted-foreground">Removed</span>
              <span className="font-bold text-foreground ml-auto">—</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Net</span>
              <span className="font-bold text-dashboard-success ml-auto">—</span>
            </div>
          </div>
        </div>

        {/* Members table */}
        <div className="dashboard-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Members</h2>
            <Link to={orgPath(`team/${team.slug}/members`)} className="text-sm text-primary hover:underline">View all →</Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Commits</TableHead>
                <TableHead className="text-right">PRs Opened</TableHead>
                <TableHead className="text-right">PRs Merged</TableHead>
                <TableHead className="text-right">Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-6">No members data available.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Repositories */}
        <div className="dashboard-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Repositories</h2>
            <Link to={orgPath(`team/${team.slug}/repos`)} className="text-sm text-primary hover:underline">View all →</Link>
          </div>
          <p className="text-sm text-muted-foreground">No repositories found.</p>
        </div>
      </main>
    </div>
  );
};

export default TeamDetail;
