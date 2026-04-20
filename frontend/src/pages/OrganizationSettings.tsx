import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Key, Plus, Trash2 } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { useApp } from '@/contexts/AppContext';

interface ApiOrg {
  id: number;
  login: string;
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  public_repos: number | null;
  followers: number | null;
  created_at: string | null;
  has_active_token: boolean;
}

interface ApiToken {
  id: number;
  description: string;
  created_at: string | null;
  last_used_at: string | null;
}

const OrganizationSettings = () => {
  const { workspace, org } = useParams<{ workspace: string; org: string }>();
  const { activeWorkspace } = useApp();
  const navigate = useNavigate();
  const isOwner = activeWorkspace?.relationship === 'owner';

  const [orgData, setOrgData] = useState<ApiOrg | null>(null);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Set token state
  const [setTokenDialogOpen, setSetTokenDialogOpen] = useState(false);
  const [formPat, setFormPat] = useState('');
  const [formTokenDescription, setFormTokenDescription] = useState('');
  const [setting, setSetting] = useState(false);
  const [setTokenError, setSetTokenError] = useState<string | null>(null);

  // Revoke token state
  const [revokeDialog, setRevokeDialog] = useState<ApiToken | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Delete organization state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchOrg = () =>
    axiosInstance.get(`/v1/${workspace}/organizations/${org}`)
      .then(res => setOrgData(res.data.data as ApiOrg))
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
        else console.error('Failed to fetch organization:', err);
      });

  const fetchTokens = () =>
    axiosInstance.get(`/v1/${workspace}/organizations/${org}/tokens`)
      .then(res => setTokens(res.data.data as ApiToken[]))
      .catch(err => console.error('Failed to fetch tokens:', err));

  useEffect(() => {
    if (!workspace || !org) return;
    setLoading(true);
    Promise.all([fetchOrg(), fetchTokens()]).finally(() => setLoading(false));
  }, [workspace, org]);

  const handleSetToken = async () => {
    if (!formPat.trim() || !workspace || !org) return;
    setSetting(true);
    setSetTokenError(null);
    try {
      await axiosInstance.post(`/v1/${workspace}/organizations`, {
        login: org,
        api_key: formPat.trim(),
        description: formTokenDescription.trim() || undefined,
      });
      setFormPat('');
      setFormTokenDescription('');
      setSetTokenDialogOpen(false);
      await Promise.all([fetchOrg(), fetchTokens()]);
    } catch (err: any) {
      setSetTokenError(err.response?.data?.detail ?? 'Failed to set API key');
    } finally {
      setSetting(false);
    }
  };

  const handleRevokeToken = async () => {
    if (!revokeDialog || !workspace || !org) return;
    setRevoking(true);
    try {
      await axiosInstance.delete(`/v1/${workspace}/organizations/${org}/tokens/${revokeDialog.id}`);
      setRevokeDialog(null);
      await Promise.all([fetchOrg(), fetchTokens()]);
    } catch (err) {
      console.error('Failed to revoke token:', err);
    } finally {
      setRevoking(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!workspace || !org) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await axiosInstance.delete(`/v1/${workspace}/organizations/${org}`);
      navigate(`/${workspace}`);
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail ?? 'Failed to remove organization');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

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

  if (notFound || !orgData) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <TopNav />
        <main className="container mx-auto py-12 text-center">
          <p className="text-muted-foreground text-lg">Organization not found</p>
          <Link to={`/${workspace}/${org}`} className="text-primary underline mt-4 inline-block">← Back</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 max-w-3xl space-y-8">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <Link to={`/${workspace}/${org}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            {orgData.avatar_url && (
              <img src={orgData.avatar_url} alt={orgData.login} className="w-10 h-10 rounded-lg object-cover" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Organization Settings</h1>
              <p className="text-sm text-muted-foreground">{orgData.name ?? orgData.login}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <section className="dashboard-section space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">GitHub Login</span>
              <p className="font-medium text-foreground font-mono">@{orgData.login}</p>
            </div>
            <div>
              <span className="text-muted-foreground">GitHub ID</span>
              <p className="font-medium text-foreground font-mono">{orgData.id}</p>
            </div>
            {orgData.description && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Description</span>
                <p className="font-medium text-foreground">{orgData.description}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Public Repos</span>
              <p className="font-medium text-foreground">{orgData.public_repos ?? '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Followers</span>
              <p className="font-medium text-foreground">{orgData.followers ?? '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created</span>
              <p className="font-medium text-foreground">{formatDate(orgData.created_at)}</p>
            </div>
          </div>
        </section>

        {/* API Token */}
        <section className="dashboard-section space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">API Token</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                GitHub PAT used to access this organization's repositories and data
              </p>
            </div>
            {isOwner && (
              <Button
                size="sm"
                onClick={() => { setFormPat(''); setFormTokenDescription(''); setSetTokenError(null); setSetTokenDialogOpen(true); }}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" /> {tokens.length > 0 ? 'Add Token' : 'Set Token'}
              </Button>
            )}
          </div>

          {tokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No active token configured</p>
              {isOwner && (
                <p className="text-xs mt-1">Use "Set Token" to add a GitHub PAT for this organization.</p>
              )}
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    {isOwner && <TableHead className="w-12" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map(token => (
                    <TableRow key={token.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Key className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium text-foreground">{token.description || '—'}</span>
                          <Badge variant="secondary" className="text-xs">active</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(token.created_at)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(token.last_used_at)}</TableCell>
                      {isOwner && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setRevokeDialog(token)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Danger Zone (owners only) */}
        {isOwner && (
          <section className="space-y-4 border border-destructive/40 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-medium text-foreground">Remove this organization</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Removes <strong>@{orgData.login}</strong> from this workspace, including all tokens and membership records. Collected data (repositories, commits, PRs) is retained.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => { setDeleteConfirm(''); setDeleteError(null); setDeleteDialogOpen(true); }}
              >
                Remove Organization
              </Button>
            </div>
          </section>
        )}
      </main>

      {/* Set token dialog */}
      <Dialog open={setTokenDialogOpen} onOpenChange={setSetTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tokens.length > 0 ? 'Add API Token' : 'Set API Token'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Provide a GitHub Personal Access Token with at least <span className="font-mono">read:org</span> scope for <strong>@{orgData.login}</strong>.
              {tokens.length > 0 && ' This will add a new active token alongside the existing one.'}
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">GitHub PAT</label>
              <Input
                type="password"
                value={formPat}
                onChange={e => setFormPat(e.target.value)}
                placeholder="ghp_..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input
                value={formTokenDescription}
                onChange={e => setFormTokenDescription(e.target.value)}
                placeholder="e.g. CI token, read-only access"
              />
            </div>
            {setTokenError && <p className="text-sm text-destructive">{setTokenError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetTokenDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSetToken} disabled={setting || !formPat.trim()}>
              {setting ? 'Saving…' : 'Save Token'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete organization dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { if (!deleting) { setDeleteDialogOpen(open); setDeleteConfirm(''); setDeleteError(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove organization?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              This will remove <strong>@{orgData.login}</strong> from this workspace and revoke all associated tokens. This action cannot be undone.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Type <span className="font-mono text-foreground">{orgData.login}</span> to confirm
              </label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={orgData.login}
                autoComplete="off"
              />
            </div>
            {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrg}
              disabled={deleting || deleteConfirm !== orgData.login}
            >
              {deleting ? 'Removing…' : 'Remove Organization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke token dialog */}
      <Dialog open={!!revokeDialog} onOpenChange={() => setRevokeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke token?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will immediately revoke the token created on {formatDate(revokeDialog?.created_at ?? null)}.
            Any integrations relying on it will lose access.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevokeToken} disabled={revoking}>
              {revoking ? 'Revoking…' : 'Revoke Token'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationSettings;
