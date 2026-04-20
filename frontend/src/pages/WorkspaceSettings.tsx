import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Trash2, Plus, Copy, Key, UserPlus, ChevronDown, ExternalLink } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { useUser } from '@/contexts/UserContext';

interface ApiWorkspace {
  id: number;
  external_id: string;
  description: string;
  created_at: string | null;
}

interface ApiMember {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  relationship: string;
}

interface ApiToken {
  id: number;
  description: string;
  created_at: string | null;
}

const WorkspaceSettings = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userData } = useUser();

  const [workspace, setWorkspace] = useState<ApiWorkspace | null>(null);
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Invite state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Remove member state
  const [removeMemberDialog, setRemoveMemberDialog] = useState<ApiMember | null>(null);
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null);

  // Token state
  const [createTokenDialog, setCreateTokenDialog] = useState(false);
  const [tokenDescription, setTokenDescription] = useState('');
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);
  const [revokeTokenDialog, setRevokeTokenDialog] = useState<ApiToken | null>(null);

  // Delete workspace state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const MEMBERS_PREVIEW = 3;
  const [showAllMembers, setShowAllMembers] = useState(false);

  const fetchMembers = () =>
    axiosInstance.get(`/v1/workspaces/${id}/members`)
      .then(res => setMembers(res.data.data as ApiMember[]))
      .catch(err => console.error('Failed to fetch members:', err));

  const fetchTokens = () =>
    axiosInstance.get(`/v1/workspaces/${id}/tokens`)
      .then(res => setTokens(res.data.data as ApiToken[]))
      .catch(err => console.error('Failed to fetch tokens:', err));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axiosInstance.get(`/v1/workspaces/${id}`)
      .then(res => setWorkspace(res.data.workspace as ApiWorkspace))
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
        else console.error('Failed to fetch workspace:', err);
      })
      .finally(() => setLoading(false));

    fetchMembers();
    fetchTokens();
  }, [id]);

  const handleInvite = async () => {
    if (!inviteUsername.trim() || !id) return;
    setInviteError(null);
    try {
      await axiosInstance.post(`/v1/workspaces/${id}/members`, {
        username: inviteUsername.trim(),
        relationship: inviteRole,
      });
      await fetchMembers();
      setInviteUsername('');
      setInviteRole('member');
      setInviteDialogOpen(false);
    } catch (err: any) {
      setInviteError(err.response?.data?.detail ?? 'Failed to add member');
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberDialog || !id) return;
    setRemoveMemberError(null);
    try {
      await axiosInstance.delete(`/v1/workspaces/${id}/members/${removeMemberDialog.id}`);
      setMembers(prev => prev.filter(m => m.id !== removeMemberDialog.id));
      setRemoveMemberDialog(null);
    } catch (err: any) {
      setRemoveMemberError(err.response?.data?.detail ?? 'Failed to remove member');
    }
  };

  const handleCreateToken = async () => {
    if (!tokenDescription.trim() || !id) return;
    try {
      const res = await axiosInstance.post(`/v1/workspaces/${id}/tokens`, {
        description: tokenDescription.trim(),
      });
      setNewlyCreatedToken(res.data.token as string);
      setTokenDescription('');
      await fetchTokens();
    } catch (err) {
      console.error('Failed to create token:', err);
    }
  };

  const handleRevokeToken = async () => {
    if (!revokeTokenDialog || !id) return;
    try {
      await axiosInstance.delete(`/v1/workspaces/${id}/tokens/${revokeTokenDialog.id}`);
      setTokens(prev => prev.filter(t => t.id !== revokeTokenDialog.id));
      setRevokeTokenDialog(null);
    } catch (err) {
      console.error('Failed to revoke token:', err);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/v1/workspaces/${id}`);
      navigate('/workspaces');
    } catch (err) {
      console.error('Failed to delete workspace:', err);
      setDeleting(false);
    }
  };

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

  if (notFound || !workspace) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <TopNav />
        <main className="container mx-auto py-12 text-center">
          <p className="text-muted-foreground text-lg">Workspace not found</p>
          <Link to="/workspaces" className="text-primary underline mt-4 inline-block">← Back to workspaces</Link>
        </main>
      </div>
    );
  }

  const formatDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';

  const payloadUrl = `${window.location.origin}/webhook?workspace_id=${workspace.external_id}`;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 max-w-3xl space-y-8">
        <div className="flex items-center gap-3">
          <Link to="/workspaces" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Workspace Settings</h1>
            <p className="text-sm text-muted-foreground">{workspace.description || workspace.external_id}</p>
          </div>
        </div>

        {/* Details */}
        <section className="dashboard-section space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Workspace ID</span>
              <p className="font-medium text-foreground font-mono">{workspace.external_id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created</span>
              <p className="font-medium text-foreground">{formatDate(workspace.created_at)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Members</span>
              <p className="font-medium text-foreground">{members.length}</p>
            </div>
          </div>
        </section>

        {/* Members */}
        <section className="dashboard-section space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Members</h2>
            <Button size="sm" onClick={() => { setInviteError(null); setInviteDialogOpen(true); }} className="gap-1.5">
              <UserPlus className="w-4 h-4" /> Invite
            </Button>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">No members found.</TableCell>
                  </TableRow>
                )}
                {(showAllMembers ? members : members.slice(0, MEMBERS_PREVIEW)).map((member) => {
                  const display = member.name || member.login;
                  const initials = display.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const isSelf = member.login === userData?.username;
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-accent text-accent-foreground">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">{display}</p>
                            <p className="text-xs text-muted-foreground">@{member.login}</p>
                            {member.email && <p className="text-xs text-muted-foreground">{member.email}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.relationship === 'owner' ? 'default' : 'outline'} className="capitalize">
                          {member.relationship}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!isSelf && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => { setRemoveMemberError(null); setRemoveMemberDialog(member); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {members.length > MEMBERS_PREVIEW && (
            <button
              onClick={() => setShowAllMembers(v => !v)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllMembers ? 'rotate-180' : ''}`} />
              {showAllMembers
                ? 'Show fewer members'
                : `Show ${members.length - MEMBERS_PREVIEW} more member${members.length - MEMBERS_PREVIEW !== 1 ? 's' : ''}`}
            </button>
          )}
        </section>

        {/* GitHub Webhook */}
        <section className="dashboard-section space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">GitHub Webhook</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Connect this workspace to GitHub so activity streams in automatically.
              </p>
            </div>
            <a
              href="https://github.com/capitaltg/devpulse-dashboard/blob/main/docs/getting-started.md#2-add-a-github-webhook"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0 mt-1"
            >
              <ExternalLink className="w-3 h-3" /> Full guide
            </a>
          </div>

          <ol className="space-y-4 text-sm">
            <li className="space-y-1">
              <div className="font-medium text-foreground">1. Create a security token below</div>
              <p className="text-muted-foreground">
                In the <span className="font-medium">Security Tokens</span> section, click{' '}
                <span className="font-medium">New Token</span>. Copy the generated secret — you'll
                paste it into GitHub in step 3, and you won't be able to see it again.
              </p>
            </li>

            <li className="space-y-1">
              <div className="font-medium text-foreground">2. Open GitHub's webhook settings</div>
              <p className="text-muted-foreground">
                In GitHub, go to your organization's{' '}
                <span className="font-medium">Settings → Webhooks → Add webhook</span> (recommended —
                covers every repo in the org), or do the same on an individual repository.
              </p>
            </li>

            <li className="space-y-2">
              <div className="font-medium text-foreground">3. Fill in the webhook form with these values</div>
              <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">Payload URL</span>
                  <code className="text-xs font-mono text-foreground flex-1 break-all">{payloadUrl}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => navigator.clipboard.writeText(payloadUrl)}
                    title="Copy payload URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">Content type</span>
                  <code className="text-xs font-mono text-foreground flex-1">application/json</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => navigator.clipboard.writeText('application/json')}
                    title="Copy content type"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">Secret</span>
                  <span className="text-xs text-muted-foreground italic flex-1">the token you copied in step 1</span>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">Which events</span>
                  <span className="text-xs text-foreground flex-1">Send me everything</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave <span className="font-medium">SSL verification</span> enabled. DevPulse filters
                events internally — no need to pick individual ones.
              </p>
            </li>

            <li className="space-y-1">
              <div className="font-medium text-foreground">4. Save the webhook</div>
              <p className="text-muted-foreground">
                GitHub sends a ping event immediately; activity streams live into the dashboard
                from then on. You can verify from GitHub's{' '}
                <span className="font-medium">Recent Deliveries</span> tab that it returned a 200.
              </p>
            </li>
          </ol>
        </section>

        {/* Security Tokens */}
        <section className="dashboard-section space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Security Tokens</h2>
              <p className="text-sm text-muted-foreground mt-0.5">API tokens to enable GitHub webhook integration</p>
            </div>
            <Button size="sm" onClick={() => { setCreateTokenDialog(true); setNewlyCreatedToken(null); }} className="gap-1.5">
              <Plus className="w-4 h-4" /> New Token
            </Button>
          </div>

          {tokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No tokens created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div key={token.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{token.description}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Created {formatDate(token.created_at)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setRevokeTokenDialog(token)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="space-y-4 border border-destructive/40 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Delete this workspace</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently removes the workspace, all members, and all tokens. This cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { setDeleteConfirmText(''); setDeleteDialogOpen(true); }}
            >
              Delete Workspace
            </Button>
          </div>
        </section>
      </main>

      {/* Invite member dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Username</label>
              <Input value={inviteUsername} onChange={(e) => setInviteUsername(e.target.value)} placeholder="github-username" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Role</label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!inviteUsername.trim()}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create token dialog */}
      <Dialog open={createTokenDialog} onOpenChange={(open) => { setCreateTokenDialog(open); if (!open) setNewlyCreatedToken(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newlyCreatedToken ? 'Token Created' : 'Create Security Token'}</DialogTitle>
          </DialogHeader>
          {newlyCreatedToken ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Copy this token now — you won't be able to see it again.
              </p>
              <div className="flex items-center gap-2 p-3 bg-accent rounded-lg">
                <code className="text-xs font-mono text-foreground flex-1 break-all">{newlyCreatedToken}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => navigator.clipboard.writeText(newlyCreatedToken)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => { setCreateTokenDialog(false); setNewlyCreatedToken(null); }}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Input value={tokenDescription} onChange={(e) => setTokenDescription(e.target.value)} placeholder="e.g. CI/CD Pipeline" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateTokenDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateToken} disabled={!tokenDescription.trim()}>Create Token</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke token dialog */}
      <Dialog open={!!revokeTokenDialog} onOpenChange={() => setRevokeTokenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke "{revokeTokenDialog?.description}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will immediately invalidate the token. Any services using it will lose access.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTokenDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevokeToken}>Revoke Token</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove member dialog */}
      <Dialog open={!!removeMemberDialog} onOpenChange={(open) => { if (!open) setRemoveMemberDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removeMemberDialog?.name || removeMemberDialog?.login}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will remove <strong>@{removeMemberDialog?.login}</strong> from the workspace. They will lose access immediately.
          </p>
          {removeMemberError && <p className="text-sm text-destructive">{removeMemberError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveMemberDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveMember}>Remove Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete workspace dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete workspace?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              This will permanently delete <strong>{workspace?.external_id}</strong>, all its members, and all tokens. This action cannot be undone.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Type <span className="font-mono">{workspace?.external_id}</span> to confirm
              </label>
              <Input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder={workspace?.external_id}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWorkspace}
              disabled={deleting || deleteConfirmText !== workspace?.external_id}
            >
              {deleting ? 'Deleting…' : 'Delete Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkspaceSettings;
