import type { EventStatus } from '@/types/api';

const statusLabel: Record<EventStatus, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const statusClass: Record<EventStatus, string> = {
  draft: 'badge--draft',
  scheduled: 'badge--scheduled',
  in_progress: 'badge--progress',
  completed: 'badge--completed',
  cancelled: 'badge--cancelled',
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={`badge ${statusClass[status]}`}>
      {statusLabel[status]}
    </span>
  );
}
