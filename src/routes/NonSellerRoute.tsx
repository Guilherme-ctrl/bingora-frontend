import { useAuth } from '@/hooks/useAuth';
import type { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';

/** Redireciona vendedores para o balcão do evento ou lista de eventos. */
export function NonSellerRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { eventId } = useParams<{ eventId?: string }>();

  if (user?.role === 'seller') {
    if (eventId) {
      return (
        <Navigate to={`/events/${eventId}/vender`} replace />
      );
    }
    return <Navigate to="/events" replace />;
  }
  return <>{children}</>;
}
