import { AuthContext, type AuthState } from '@/contexts/auth-context';
import * as authService from '@/services/authService';
import { getStoredAccessToken } from '@/services/tokenStorage';
import type { OrganizerProfile } from '@/types/api';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await authService.fetchMe();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      navigate('/login', { replace: true });
    };
    window.addEventListener('bingo:auth-unauthorized', onUnauthorized);
    return () =>
      window.removeEventListener('bingo:auth-unauthorized', onUnauthorized);
  }, [navigate]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setUser(res.organizer);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await authService.register(email, password);
    setUser(res.organizer);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
