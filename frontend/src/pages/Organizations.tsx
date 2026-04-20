import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, GitBranch, Github, KeyRound, Plus, Settings } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import axiosInstance from '@/api/axiosInstance';
import { Link, useNavigate } from 'react-router-dom';

interface ApiOrg {
  id: number;
  login: string;
  name: string | null;
  description: string | null;
  public_repos: number | null;
  followers: number | null;
  html_url: string | null;
  avatar_url: string | null;
  created_at: string | null;
  has_active_token: boolean;
}

const Organizations = () => {
  const { activeWorkspace } = useApp();
  const navigate = useNavigate();
  const isOwner = activeWorkspace?.relationship === 'owner';
  const [orgs, setOrgs] = useState<ApiOrg[]>([]);
  const [loading, setLoading] = useState(true);

  // Add organization dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formLogin, setFormLogin] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchOrgs = () => {
    if (!activeWorkspace) return;
    setLoading(true);
    axiosInstance
      .get(`/v1/${activeWorkspace.id}/organizations`)
      .then(res => setOrgs(res.data.data as ApiOrg[]))
      .catch(err => console.error('Failed to fetch organizations:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrgs();
  }, [activeWorkspace?.id]);

  const openAdd = () => {
    setFormLogin('');
    setFormApiKey('');
    setAddError(null);
    setAddDialogOpen(true);
  };

  const handleAddOrg = async () => {
    if (!formLogin.trim() || !formApiKey.trim() || !activeWorkspace) return;
    setAdding(true);
    setAddError(null);
    try {
      await axiosInstance.post(`/v1/${activeWorkspace.id}/organizations`, {
        login: formLogin.trim(),
        api_key: formApiKey.trim(),
      });
      setAddDialogOpen(false);
      fetchOrgs();
    } catch (err: any) {
      setAddError(err.response?.data?.detail ?? 'Failed to add organization');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">GitHub Organizations</h1>
            <p className="text-sm text-muted-foreground">Connected GitHub organizations in this workspace</p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Organization
          </Button>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading organizations…</p>}

        {!loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgs.map(org => (
              <Card
                key={org.id}
                className="h-full hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/${activeWorkspace?.id}/${org.login}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {org.avatar_url ? (
                        <img src={org.avatar_url} alt={org.login} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                          <Github className="w-5 h-5 text-accent-foreground" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{org.name ?? org.login}</CardTitle>
                        <p className="text-xs text-muted-foreground">@{org.login}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {org.has_active_token && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <KeyRound className="w-3 h-3" /> Token
                        </Badge>
                      )}
                      {isOwner && (
                        <Link
                          to={`/${activeWorkspace?.id}/${org.login}/settings`}
                          onClick={e => e.stopPropagation()}
                          className="ml-1 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Organization settings"
                        >
                          <Settings className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                  {org.description && (
                    <CardDescription className="mt-2 line-clamp-2">{org.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {org.followers != null && (
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> {org.followers.toLocaleString()} followers
                      </span>
                    )}
                    {org.public_repos != null && (
                      <span className="flex items-center gap-1.5">
                        <GitBranch className="w-4 h-4" /> {org.public_repos} repos
                      </span>
                    )}
                  </div>
                  {org.created_at && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Since {new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
            {orgs.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-3">No organizations found.</p>
            )}
          </div>
        )}
      </main>

      {/* Add organization dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">GitHub Organization Name</label>
              <Input
                value={formLogin}
                onChange={e => setFormLogin(e.target.value)}
                placeholder="e.g. my-org"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">API Key</label>
              <Input
                type="password"
                value={formApiKey}
                onChange={e => setFormApiKey(e.target.value)}
                placeholder="GitHub Personal Access Token"
              />
              <p className="text-xs text-muted-foreground">
                Token needs at least <span className="font-mono">read:org</span> scope.
              </p>
            </div>
            {addError && <p className="text-sm text-destructive">{addError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAddOrg}
              disabled={adding || !formLogin.trim() || !formApiKey.trim()}
            >
              {adding ? 'Adding…' : 'Add Organization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Organizations;
