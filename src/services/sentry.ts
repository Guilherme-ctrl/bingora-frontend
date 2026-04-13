import { useEffect } from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router';
import * as Sentry from '@sentry/react';
import type { OrganizerProfile } from '@/types/api';
import { getApiBaseUrl } from '@/services/config';

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  const tracesSampleRate = Number.parseFloat(
    (import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE as string | undefined) ??
      '0.05',
  );

  const replaySession = Number.parseFloat(
    (import.meta.env.VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE as
      | string
      | undefined) ?? '0',
  );
  const replayOnError = Number.parseFloat(
    (import.meta.env.VITE_SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE as
      | string
      | undefined) ?? '0.1',
  );

  const integrations = [
    Sentry.reactRouterV7BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ];

  const useReplay =
    Number.isFinite(replayOnError) && replayOnError > 0;

  if (useReplay) {
    integrations.push(
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    );
  }

  const tracePropagationTargets: (string | RegExp)[] = [/^\//];
  try {
    const base = getApiBaseUrl();
    if (/^https?:\/\//i.test(base)) {
      tracePropagationTargets.push(new URL(base).origin);
    }
  } catch {
    /* ignore */
  }

  Sentry.init({
    dsn,
    environment:
      (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ??
      import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE as string | undefined,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.05,
    integrations,
    tracePropagationTargets,
    ...(useReplay
      ? {
          replaysSessionSampleRate: Number.isFinite(replaySession)
            ? replaySession
            : 0,
          replaysOnErrorSampleRate: replayOnError,
        }
      : {}),
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
