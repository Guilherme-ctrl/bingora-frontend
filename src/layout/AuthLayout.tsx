import type { ReactNode } from 'react';

import { branding } from '@/constants/branding';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__panel">
        <div className="auth-layout__brand">
          <img
            src={branding.logoWordmark}
            alt=""
            className="auth-layout__logo"
            decoding="async"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
