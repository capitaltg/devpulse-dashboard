import { useEffect } from 'react';
import { useParams, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

/**
 * Layout route for all pages scoped under /:workspace/:org.
 * Reads URL params and syncs them into AppContext so child pages
 * can use useApp() without caring about the URL structure.
 */
export function WorkspaceOrgLayout() {
  const { workspace, org } = useParams<{ workspace: string; org: string }>();
  const { activeWorkspace, activeOrg, setActiveWorkspace, setActiveOrg } = useApp();
  const auth = useAuth();

  useEffect(() => {
    if (!workspace || !org) return;
    if (activeWorkspace?.id !== workspace) {
      // We only know the id from the URL — name/relationship will be filled in
      // when the Workspaces page is visited or sessionStorage restores them.
      setActiveWorkspace({ id: workspace, name: workspace, relationship: '' });
    }
    if (activeOrg?.id !== org) {
      setActiveOrg({ id: org, name: org, login: org });
    }
  }, [workspace, org]);

  if (auth.isLoading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading…</div>;
  if (!auth.isAuthenticated) return <Navigate to="/" replace />;

  return <Outlet />;
}
