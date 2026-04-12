import type { EventWorkspaceOutlet } from '@/types/eventWorkspace';
import { useOutletContext } from 'react-router-dom';

export function useEventWorkspace(): EventWorkspaceOutlet {
  return useOutletContext<EventWorkspaceOutlet>();
}
