import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Settings, BookOpen, Rocket } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { useApp } from '@/contexts/AppContext';

interface ApiWorkspace {
  id: number;
  external_id: string;
  description: string;
  relationship: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const Workspaces = () => {
  const { setActiveWorkspace } = useApp();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<ApiWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formDescription, setFormDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      const response = await axiosInstance.get('/v1/workspaces');
      setWorkspaces(response.data.workspaces as ApiWorkspace[]);
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
      setError('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkspaces(); }, []);

  const handleSelect = async (ws: ApiWorkspace) => {
    setActiveWorkspace({ id: ws.external_id, name: ws.description, relationship: ws.relationship });
    try {
      const res = await axiosInstance.get(`/v1/${ws.external_id}/organizations`);
      const orgs: Array<{ login: string; name: string | null }> = res.data.data;
      const firstOrg = orgs[0];
      navigate(firstOrg ? `/${ws.external_id}/${firstOrg.login}` : `/${ws.external_id}/_/organizations`);
    } catch {
      navigate(`/${ws.external_id}/_/organizations`);
    }
  };

  const openCreate = () => {
    setFormDescription('');
    setCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formDescription.trim()) return;
    const isFirstWorkspace = workspaces.length === 0;
    setCreating(true);
    try {
      const res = await axiosInstance.post('/v1/workspaces', { description: formDescription.trim() });
      const created = res.data?.data as { external_id?: string } | undefined;
      setCreateDialogOpen(false);
      if (isFirstWorkspace && created?.external_id) {
        navigate(`/workspace/${created.external_id}/settings`);
        return;
      }
      await fetchWorkspaces();
    } catch (err) {
      console.error('Failed to create workspace:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Workspaces</h1>
              <p className="text-sm text-muted-foreground">Manage your workspaces and team access</p>
            </div>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> New Workspace
          </Button>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading workspaces…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && workspaces.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-10 px-6 flex flex-col items-center text-center gap-5 max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Welcome to DevPulse</h2>
                <p className="text-sm text-muted-foreground">
                  You don't have any workspaces yet. A workspace is where you connect GitHub
                  organizations and see activity for your team.
                </p>
              </div>
              <ol className="text-sm text-muted-foreground text-left space-y-1.5 list-decimal list-inside">
                <li>Create a workspace.</li>
                <li>Add a GitHub webhook to stream activity into DevPulse.</li>
                <li>(Optional) Connect an org with a personal access token for richer detail.</li>
              </ol>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button onClick={openCreate} className="gap-2">
                  <Plus className="w-4 h-4" /> Create your first workspace
                </Button>
                <a
                  href="https://github.com/capitaltg/devpulse-dashboard/blob/main/docs/getting-started.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2">
                    <BookOpen className="w-4 h-4" /> Read the getting started guide
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map(ws => (
            <Card
              key={ws.id}
              className="group hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleSelect(ws)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                      {ws.description.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{ws.description}</CardTitle>
                      <Badge variant="secondary" className="mt-1 text-xs capitalize">{ws.relationship}</Badge>
                    </div>
                  </div>
                  {ws.relationship !== 'member' && (
                    <Link
                      to={`/workspace/${ws.external_id}/settings`}
                      onClick={e => e.stopPropagation()}
                      className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  ID: <span className="font-mono">{ws.external_id}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Created {formatDate(ws.created_at)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Name</label>
              <Input
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="e.g. My Team Workspace"
              />
              {formDescription && (
                <p className="text-xs text-muted-foreground mt-1">
                  Workspace ID: <span className="font-mono">{formDescription.toLowerCase().replace(/\s+/g, '-')}</span>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !formDescription.trim()}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Workspaces;
