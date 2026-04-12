import type { EventSummary } from '@/types/api';

export type EventWorkspaceOutlet = {
  event: EventSummary;
  reloadEvent: () => Promise<void>;
};
