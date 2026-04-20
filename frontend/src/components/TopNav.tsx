import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, GitFork, Activity, UserCircle, GitPullRequest, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp, useOrgPath } from '@/contexts/AppContext';

const navDefs = [
  { path: '', label: 'Dashboard', icon: LayoutDashboard, end: true, hideForUser: false },
  { path: 'repos', label: 'Repositories', icon: GitFork, end: false, hideForUser: false },
  { path: 'pull-requests', label: 'Pull Requests', icon: GitPullRequest, end: false, hideForUser: false },
  { path: 'teams', label: 'Teams', icon: Users, end: false, hideForUser: true },
  { path: 'contributors', label: 'Contributors', icon: UserCircle, end: false, hideForUser: false },
  { path: 'workflows', label: 'Workflows', icon: Workflow, end: false, hideForUser: false },
  { path: 'activity', label: 'Activity', icon: Activity, end: false, hideForUser: false },
];

export function TopNav() {
  const orgPath = useOrgPath();
  const { activeOrg } = useApp();
  const isUserOrg = activeOrg?.type?.toLowerCase() === 'user';

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto flex items-center gap-1 px-4 overflow-x-auto">
        {navDefs.filter(item => !(isUserOrg && item.hideForUser)).map((item) => (
          <NavLink
            key={item.path}
            to={orgPath(item.path)}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
