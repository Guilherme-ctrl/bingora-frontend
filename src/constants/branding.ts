import logoWordmarkPng from '@/assets/logo-bingora.png';

/** Product name shown in UI copy and image alt text. */
export const APP_NAME = 'Bingora';

export const branding = {
  appName: APP_NAME,
  /** Header / auth wordmark (light backgrounds). Use `@/assets/logo-white.png` on dark surfaces. */
  logoWordmark: logoWordmarkPng,
} as const;
