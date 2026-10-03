import { createContext, useContext } from 'react';
import type { User } from '../api/client';

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = LoginInput & {
  name: string;
};

export type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  sessionError: Error | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  retrySession: () => Promise<void>;
};

export const CURRENT_USER_QUERY_KEY = ['auth', 'current-user'];
export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
