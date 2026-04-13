import * as Sentry from '@sentry/react';
import type { OrganizerProfile } from '@/types/api';

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  const tracesSampleRate = Number.parseFloat(
    (import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE as string | undefined) ??
      '0.05',
  );

  Sentry.init({
    dsn,
    environment:
      (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ??
      import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE as string | undefined,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.05,
    sendDefaultPii: false,
  });
}

export function setSentryUser(user: OrganizerProfile | null): void {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    id: user.id,
    role: user.role,
  });
}

export function captureUnexpectedError(error: unknown, context: string): void {
  Sentry.withScope((scope) => {
    scope.setTag('app', 'frontend');
    scope.setTag('context', context);
    Sentry.captureException(
      error instanceof Error ? error : new Error(String(error)),
    );
  });
}

export { Sentry };
