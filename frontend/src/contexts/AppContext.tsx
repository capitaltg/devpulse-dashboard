import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useUser } from './UserContext';

export interface Workspace {
  id: string;        // external_id from API
  name: string;      // description from API
  relationship: string;
}

export interface Organization {
  id: string;        // org login / external_id
  name: string;
  login: string;
  type?: string;     // GitHub type: 'Organization' | 'User'
}

interface AppContextType {
  activeWorkspace: Workspace | null;
  activeOrg: Organization | null;
  setActiveWorkspace: (ws: Workspace | null) => void;
  setActiveOrg: (org: Organization | null) => void;
}

const WS_KEY = 'app.activeWorkspace';
const ORG_KEY = 'app.activeOrg';

function readSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSession(key: string, value: unknown) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { userData } = useUser();
  // undefined = "not yet seen a sub" (initial mount); null = "user is logged out"
  const prevSubRef = useRef<string | null | undefined>(undefined);

  const [activeWorkspace, _setActiveWorkspace] = useState<Workspace | null>(
    () => readSession<Workspace>(WS_KEY)
  );
  const [activeOrg, _setActiveOrg] = useState<Organization | null>(
    () => readSession<Organization>(ORG_KEY)
  );

  // When a *different* user logs in, clear the previous user's workspace/org selections.
  useEffect(() => {
    const currentSub = userData?.sub ?? null;
    if (prevSubRef.current === undefined) {
      prevSubRef.current = currentSub;
      return;
    }
    if (currentSub !== null && currentSub !== prevSubRef.current) {
      _setActiveWorkspace(null);
      _setActiveOrg(null);
      sessionStorage.removeItem(WS_KEY);
      sessionStorage.removeItem(ORG_KEY);
    }
    prevSubRef.current = currentSub;
  }, [userData?.sub]);

  const setActiveWorkspace = (ws: Workspace | null) => {
    _setActiveWorkspace(ws);
    if (ws) writeSession(WS_KEY, ws); else sessionStorage.removeItem(WS_KEY);
  };

  const setActiveOrg = (org: Organization | null) => {
    _setActiveOrg(org);
    if (org) writeSession(ORG_KEY, org); else sessionStorage.removeItem(ORG_KEY);
  };

  return (
    <AppContext.Provider value={{ activeWorkspace, activeOrg, setActiveWorkspace, setActiveOrg }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

/** Returns a function that builds a path scoped to the active workspace + org. */
export function useOrgPath() {
  const { activeWorkspace, activeOrg } = useApp();
  return (path: string) =>
    `/${activeWorkspace?.id ?? '_'}/${activeOrg?.id ?? '_'}${path ? `/${path}` : ''}`;
}

/** Returns a function that builds a path scoped to the active workspace only. */
export function useWorkspacePath() {
  const { activeWorkspace } = useApp();
  return (path: string) =>
    `/${activeWorkspace?.id ?? '_'}${path ? `/${path}` : ''}`;
}
