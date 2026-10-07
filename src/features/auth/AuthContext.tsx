import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  markSessionEnded,
  setSessionExpiredHandler,
} from '../../api/authRecovery';
import { resetCsrfToken } from '../../api/csrf';
import { login as loginRequest, revoke } from './api';
import type { LoginInput, User } from './schema';

interface AuthContextValue {
  user: User | null;
  login: (credentials: LoginInput) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const clearLocalSession = useCallback(() => {
    setUser(null);
    queryClient.clear();
    resetCsrfToken();
  }, [queryClient]);

  useEffect(() => {
    return setSessionExpiredHandler(() => {
      clearLocalSession();
      navigate('/login', { replace: true, state: { from: location } });
    });
  }, [clearLocalSession, location, navigate]);

  const login = useCallback(async (credentials: LoginInput) => {
    const nextUser = await loginRequest(credentials);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await revoke();
    } finally {
      clearLocalSession();
      markSessionEnded();
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
