import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  markSessionEstablished,
  setSessionExpiredHandler,
} from '../../api/authRecovery';
import { resetCsrfToken } from '../../api/csrf';
import { login as loginRequest, revoke } from './api';
import type { LoginCredentials, User } from './types';

interface AuthContextValue {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const clearLocalSession = useCallback(() => {
    setUser(null);
    queryClient.clear();
    resetCsrfToken();
  }, [queryClient]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      clearLocalSession();
      navigate('/login', { replace: true });
    });
  }, [clearLocalSession, navigate]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const nextUser = await loginRequest(credentials);
      setUser(nextUser);
      queryClient.setQueryData(['me'], nextUser);
      return nextUser;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await revoke();
    } finally {
      clearLocalSession();
      markSessionEstablished();
      navigate('/login', { replace: true });
    }
  }, [clearLocalSession, navigate]);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
};
