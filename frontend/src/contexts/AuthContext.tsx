/**
 * Unified auth abstraction. Exposes the same shape across OIDC and GitHub
 * providers so the rest of the app doesn't care which one is active.
 *
 * - OIDC mode: delegates to react-oidc-context under the hood.
 * - GitHub mode: manages a backend-issued session JWT in localStorage.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useAuth as useOidcAuth } from 'react-oidc-context';

export interface AuthUser {
  access_token: string;
  profile?: Record<string, unknown>;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  signinRedirect: () => void;
  signoutRedirect: () => void;
  signoutSilent: () => void;
  removeUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an auth provider');
  }
  return ctx;
}

/**
 * Mounts inside react-oidc-context's AuthProvider and republishes its state
 * through our unified context.
 */
export function OidcAuthBridge({ children }: { children: ReactNode }) {
  const oidc = useOidcAuth();
  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: oidc.isAuthenticated,
      isLoading: oidc.isLoading,
      user: oidc.user
        ? { access_token: oidc.user.access_token, profile: oidc.user.profile }
        : null,
      signinRedirect: () => {
        void oidc.signinRedirect();
      },
      signoutRedirect: () => {
        void oidc.signoutRedirect();
      },
      signoutSilent: () => {
        void oidc.signoutSilent();
      },
      removeUser: () => {
        void oidc.removeUser();
      },
    }),
    [oidc.isAuthenticated, oidc.isLoading, oidc.user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const GITHUB_TOKEN_KEY = 'devpulse_session_token';
const TOKEN_FRAGMENT_PREFIX = '#token=';

function readInitialToken(): string | null {
  if (typeof window === 'undefined') return null;
  if (window.location.hash.startsWith(TOKEN_FRAGMENT_PREFIX)) {
    const fromHash = window.location.hash.slice(TOKEN_FRAGMENT_PREFIX.length);
    if (fromHash) {
      localStorage.setItem(GITHUB_TOKEN_KEY, fromHash);
      // Strip the fragment so it's not kept in history / refreshes.
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search,
      );
      return fromHash;
    }
  }
  return localStorage.getItem(GITHUB_TOKEN_KEY);
}

export function GithubAuthProvider({
  loginUrl,
  children,
}: {
  loginUrl: string;
  children: ReactNode;
}) {
  const [token, setToken] = useState<string | null>(() => readInitialToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial state already read synchronously; just flip loading off.
    setIsLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const clear = () => {
      localStorage.removeItem(GITHUB_TOKEN_KEY);
      setToken(null);
    };
    return {
      isAuthenticated: !!token,
      isLoading,
      user: token ? { access_token: token } : null,
      signinRedirect: () => {
        window.location.href = loginUrl;
      },
      signoutRedirect: () => {
        clear();
        window.location.href = '/';
      },
      signoutSilent: clear,
      removeUser: clear,
    };
  }, [token, isLoading, loginUrl]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
