import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiRequest,
  clearAuthToken,
  readAuthToken,
  writeAuthToken,
  type User,
} from '../api/client';
import {
  AuthContext,
  CURRENT_USER_QUERY_KEY,
  type AuthContextValue,
} from './useAuth';

type AuthResponse = {
  user: User;
  token: string;
};

async function fetchCurrentUser(): Promise<User> {
  const response = await apiRequest<{ user: User }>('/auth/me');
  return response.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => readAuthToken());
  const currentUserQuery = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    };

    window.addEventListener('kanban:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('kanban:unauthorized', handleUnauthorized);
  }, [queryClient]);

  const establishSession = useCallback(
    (response: AuthResponse) => {
      writeAuthToken(response.token);
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, response.user);
      setToken(response.token);
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: token ? (currentUserQuery.data ?? null) : null,
      isLoading: Boolean(token) && currentUserQuery.isLoading,
      sessionError: token && currentUserQuery.error instanceof Error
        ? currentUserQuery.error
        : null,
      login: async (input) => {
        const response = await apiRequest<AuthResponse>(
          '/auth/login',
          { method: 'POST', body: JSON.stringify(input) },
          false,
        );
        establishSession(response);
      },
      register: async (input) => {
        const response = await apiRequest<AuthResponse>(
          '/auth/register',
          { method: 'POST', body: JSON.stringify(input) },
          false,
        );
        establishSession(response);
      },
      logout: () => {
        clearAuthToken();
        queryClient.clear();
        setToken(null);
      },
      retrySession: async () => {
        await currentUserQuery.refetch();
      },
    }),
    [currentUserQuery, establishSession, queryClient, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
