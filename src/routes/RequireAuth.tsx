import { useAuth } from '@/hooks/useAuth';
import { getStoredAccessToken } from '@/services/tokenStorage';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export function RequireAuth() {
  const { loading } = useAuth();
  const location = useLocation();
  const token = getStoredAccessToken();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" aria-hidden />
        <p className="app-loading__text">Carregando…</p>
      </div>
    );
  }

  if (!token) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
