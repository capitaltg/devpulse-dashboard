import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios, { setAuthToken } from '../api/axiosInstance';

interface Workspace {
  id: number;
  external_id: string;
  description: string;
  creator_id: number;
  created_at: string;
  updated_at: string;
  relationship: string;
}

interface UserData {
  sub: string;
  username: string;
  display_name: string;
  email: string;
  roles: string[];
  groups: string[];
  workspaces: Workspace[];
}

interface UserContextType {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  refetchUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!auth.user?.access_token) {
      setLoading(false);
      return;
    }

    setAuthToken(auth.user.access_token);

    try {
      const response = await axios.get('/v1/me');
      setUserData(response.data.data as UserData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.user?.access_token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [auth.user?.access_token]);

  return (
    <UserContext.Provider value={{ userData, loading, error, refetchUserData: fetchUserData }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
