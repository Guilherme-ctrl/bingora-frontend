import { useAuth } from '@/hooks/useAuth';
import { LandingPage } from '@/pages/LandingPage';
import { getStoredAccessToken } from '@/services/tokenStorage';
import { Navigate } from 'react-router-dom';

/**
 * `/` — landing para visitantes; usuários com sessão válida vão para a área logada.
 */
export function HomeRoute() {
  const { loading } = useAuth();
  const token = getStoredAccessToken();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" aria-hidden />
        <p className="app-loading__text">Carregando…</p>
      </div>
    );
  }

  if (token) {
    return <Navigate to="/events" replace />;
  }

  return <LandingPage />;
}
