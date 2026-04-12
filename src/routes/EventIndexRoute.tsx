import { EventOverviewPage } from '@/pages/event/EventOverviewPage';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useParams } from 'react-router-dom';

export function EventIndexRoute() {
  const { user } = useAuth();
  const { eventId } = useParams<{ eventId: string }>();

  if (user?.role === 'seller' && eventId) {
    return <Navigate to={`/events/${eventId}/vender`} replace />;
  }
  return <EventOverviewPage />;
}
