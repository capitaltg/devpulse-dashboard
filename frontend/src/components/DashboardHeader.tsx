import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Github, ChevronDown, User, LogOut, Settings, Building2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp, useOrgPath } from '@/contexts/AppContext';
import { useUser } from '@/contexts/UserContext';
import axiosInstance from '@/api/axiosInstance';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface GitHubOrg {
  id: string;
  name: string;
  avatarUrl: string;
  login: string;
}

// Retained for pages that haven't been wired to the API yet
const mockOrganizations: GitHubOrg[] = [
  { id: 'acme', name: 'Acme Corp', avatarUrl: '', login: 'acme-corp' },
  { id: 'side-project', name: 'Side Project', avatarUrl: '', login: 'side-project' },
  { id: 'oss', name: 'Open Source Collective', avatarUrl: '', login: 'oss-collective' },
];


/** @deprecated use AppContext instead */
export function getActiveOrg() {
  return mockOrganizations[0];
}

/** @deprecated use AppContext instead */
export function getOrganizations() {
  return mockOrganizations;
}

interface ApiOrg {
  id: number;
  login: string;
  name: string | null;
  type: string | null;
}

interface ApiWorkspace {
  external_id: string;
  description: string;
  relationship: string;
}

export function DashboardHeader() {
  const { activeOrg, activeWorkspace, setActiveOrg, setActiveWorkspace } = useApp();
  const orgPath = useOrgPath();
  const { userData } = useUser();
  const auth = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<ApiOrg[]>([]);
  const [workspaces, setWorkspaces] = useState<ApiWorkspace[]>([]);

  // Refs to avoid stale closures in async fetch callbacks
  const activeWorkspaceRef = useRef(activeWorkspace);
  activeWorkspaceRef.current = activeWorkspace;
  const activeOrgRef = useRef(activeOrg);
  activeOrgRef.current = activeOrg;

  useEffect(() => {
    axiosInstance.get('/v1/workspaces')
      .then(res => {
        const fetched = res.data.workspaces as ApiWorkspace[];
        setWorkspaces(fetched);
        // Enrich activeWorkspace with full metadata when hydrated from URL with stub data
        const current = activeWorkspaceRef.current;
        if (current && !current.relationship) {
          const match = fetched.find(ws => ws.external_id === current.id);
          if (match) {
            setActiveWorkspace({ id: match.external_id, name: match.description, relationship: match.relationship });
          }
        }
      })
      .catch(err => console.error('Failed to fetch workspaces:', err));
  }, []);

  const userName = userData?.username ?? '';
  const userUsername = userData?.display_name ?? '';
  const userInitials = userName.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || '?';

  useEffect(() => {
    if (!activeWorkspace) return;
    axiosInstance.get(`/v1/${activeWorkspace.id}/organizations`)
      .then(res => {
        const fetched: ApiOrg[] = res.data.data;
        setOrgs(fetched);
        const currentOrg = activeOrgRef.current;
        if (currentOrg) {
          // Enrich activeOrg with full metadata when hydrated from URL with stub data
          const match = fetched.find(o => o.login === currentOrg.id);
          if (match && !currentOrg.type) {
            setActiveOrg({ id: match.login, name: match.name ?? match.login, login: match.login, type: match.type ?? undefined });
          }
        } else if (fetched.length > 0) {
          // Auto-select the first org if none is selected yet
          const first = fetched[0];
          setActiveOrg({ id: first.login, name: first.name ?? first.login, login: first.login, type: first.type ?? undefined });
        }
      })
      .catch(err => console.error('Failed to fetch organizations:', err));
  }, [activeWorkspace?.id]);

  const { org: urlOrg } = useParams<{ org: string }>();
  const displayOrg = activeOrg ?? (urlOrg ? { id: urlOrg, name: urlOrg, login: urlOrg } : { id: '—', name: 'Select workspace', login: '' });
  const displayOrgs = orgs;

  const handleSwitchOrg = (org: ApiOrg) => {
    setActiveOrg({ id: org.login, name: org.name ?? org.login, login: org.login, type: org.type ?? undefined });
    navigate(`/${activeWorkspace?.id ?? '_'}/${org.login}`);
  };

  const handleSwitchWorkspace = async (ws: ApiWorkspace) => {
    setActiveWorkspace({ id: ws.external_id, name: ws.description, relationship: ws.relationship });
    setActiveOrg(null);
    try {
      const res = await axiosInstance.get(`/v1/${ws.external_id}/organizations`);
      const fetched: ApiOrg[] = res.data.data;
      const first = fetched[0];
      navigate(first ? `/${ws.external_id}/${first.login}` : `/${ws.external_id}/_/organizations`);
    } catch {
      navigate(`/${ws.external_id}/_/organizations`);
    }
  };

  return (
    <header className="page-header">
      <div className="container mx-auto flex items-center justify-between">
        {/* Org switcher */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                  <Github className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <h1 className="text-lg font-bold text-foreground leading-tight">{displayOrg.name}</h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {displayOrg.id}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                GitHub Organizations
              </DropdownMenuLabel>
              {displayOrgs.map((org) => (
                <DropdownMenuItem
                  key={org.login}
                  onClick={() => handleSwitchOrg(org)}
                  className="flex items-center gap-3 cursor-pointer py-2.5"
                >
                  <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-sm font-bold text-accent-foreground shrink-0">
                    {(org.name ?? org.login).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{org.name ?? org.login}</p>
                    <p className="text-xs text-muted-foreground">@{org.login}</p>
                  </div>
                  {org.login === displayOrg.id && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
              {activeWorkspace?.relationship === 'owner' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={orgPath('organizations')} className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" /> Manage Organizations
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground hidden sm:inline">{userName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{userUsername}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4" /> My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.external_id}
                onClick={() => handleSwitchWorkspace(ws)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {ws.description.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 truncate text-sm">{ws.description}</span>
                {ws.external_id === activeWorkspace?.id && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
            {activeWorkspace?.relationship === 'owner' && (
              <DropdownMenuItem asChild>
                <Link to={`/workspace/${activeWorkspace.id}/settings`} className="flex items-center gap-2 cursor-pointer">
                  <Settings className="w-4 h-4" /> Workspace Settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link to="/workspaces" className="flex items-center gap-2 cursor-pointer">
                <Settings className="w-4 h-4" /> Manage Workspaces
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => auth.signoutSilent()}
              className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
