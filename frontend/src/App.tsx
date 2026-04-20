import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import ProtectedRoute from "./components/ProtectedRoute";
import { WorkspaceOrgLayout } from "./components/WorkspaceOrgLayout";
import { SettingsProvider } from "@/contexts/SettingsContext";
import Index from "./pages/Index";
import RepoDetail from "./pages/RepoDetail";
import UserDetail from "./pages/UserDetail";
import NotFound from "./pages/NotFound";
import Workspaces from "./pages/Workspaces";
import Organizations from "./pages/Organizations";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import TeamMembers from "./pages/TeamMembers";
import TeamRepos from "./pages/TeamRepos";
import Repos from "./pages/Repos";
import ActivityPage from "./pages/ActivityPage";
import PullRequests from "./pages/PullRequests";
import PRDetail from "./pages/PRDetail";
import Contributors from "./pages/Contributors";
import WorkspaceSettings from "./pages/WorkspaceSettings";
import OrganizationSettings from "./pages/OrganizationSettings";
import Profile from "./pages/Profile";
import WorkflowRunsPage from "./pages/WorkflowRuns";
import Login from "./pages/Login";
import Landing from "./pages/Landing";

const queryClient = new QueryClient();

function WorkspaceRedirect() {
  const { workspace } = useParams<{ workspace: string }>();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    axiosInstance
      .get(`/v1/${workspace}/organizations`)
      .then(res => {
        const orgs = res.data.data as { login: string }[];
        if (orgs.length > 0) {
          navigate(`/${workspace}/${orgs[0].login}`, { replace: true });
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true));
  }, [workspace]);

  if (notFound) return <Navigate to="/workspaces" replace />;
  return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading…</div>;
}

function CallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isLoading) return;
    navigate(auth.isAuthenticated ? '/workspaces' : '/', { replace: true });
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen text-muted-foreground">
      Completing sign-in…
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SettingsProvider>
        <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public / auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<CallbackPage />} />

          {/* Workspace picker */}
          <Route path="/workspaces" element={<ProtectedRoute><Workspaces /></ProtectedRoute>} />
          <Route path="/workspace/:id/settings" element={<ProtectedRoute><WorkspaceSettings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/:workspace/user/:username" element={<ProtectedRoute><UserDetail /></ProtectedRoute>} />

          {/* All org-scoped pages live under /:workspace/:org */}
          <Route path="/:workspace/:org" element={<WorkspaceOrgLayout />}>
            <Route index element={<Index />} />
            <Route path="repos" element={<Repos />} />
            <Route path="repos/:name" element={<RepoDetail />} />
            <Route path="teams" element={<Teams />} />
            <Route path="team/:slug" element={<TeamDetail />} />
            <Route path="team/:slug/members" element={<TeamMembers />} />
            <Route path="team/:slug/repos" element={<TeamRepos />} />
            <Route path="contributors" element={<Contributors />} />
            <Route path="pull-requests" element={<PullRequests />} />
            <Route path="pr/:org/:repo/:number" element={<PRDetail />} />
            <Route path="activity" element={<ActivityPage />} />

            <Route path="workflows" element={<WorkflowRunsPage />} />
            <Route path="organizations" element={<Organizations />} />
            <Route path="settings" element={<OrganizationSettings />} />
          </Route>

          {/* Workspace-only URL: redirect to first org */}
          <Route path="/:workspace" element={<ProtectedRoute><WorkspaceRedirect /></ProtectedRoute>} />

          {/* Landing page for unauthenticated users */}
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
