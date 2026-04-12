import type { OrganizerProfile } from '@/types/api';
import { createContext } from 'react';

export type AuthState = {
  user: OrganizerProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);
