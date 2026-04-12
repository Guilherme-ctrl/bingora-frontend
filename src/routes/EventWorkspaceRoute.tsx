import { EventWorkspaceLayout } from '@/layout/EventWorkspaceLayout';
import { useParams } from 'react-router-dom';

/** Remount workspace when `:eventId` changes so loading state resets without effect setState. */
export function EventWorkspaceRoute() {
  const { eventId } = useParams<{ eventId: string }>();
  return <EventWorkspaceLayout key={eventId} />;
}
